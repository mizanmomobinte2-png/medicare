-- =====================================================================
-- MediCare: database features (functions, triggers, procedures)
-- Run once in pgAdmin on the "medicare" database. Safe to re-run.
-- Needs PostgreSQL 11 or newer (procedures + EXECUTE FUNCTION).
--
-- Custom error codes used by RAISE EXCEPTION (the Node code maps them to HTTP):
--   MC400 = bad input, MC404 = not found, MC409 = conflict
-- =====================================================================


-- =====================================================================
-- 1) SHADOW TABLE for the billing audit trigger
-- =====================================================================

CREATE TABLE IF NOT EXISTS billing_audit (
    audit_id    SERIAL PRIMARY KEY,
    bill_id     INT,                       -- no FK: the log must survive a deleted bill
    action      VARCHAR(10) NOT NULL,      -- UPDATE / DELETE
    old_status  VARCHAR(20),
    new_status  VARCHAR(20),
    old_amount  NUMERIC(10,2),
    new_amount  NUMERIC(10,2),
    old_discount NUMERIC(10,2),
    new_discount NUMERIC(10,2),
    changed_by  TEXT DEFAULT current_user,
    changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================================
-- 2) FUNCTIONS  (return a computed value; used by the analytics queries)
-- =====================================================================

-- Money still owed on one bill = (amount - discount + tax) - payments made
CREATE OR REPLACE FUNCTION fn_bill_balance(p_bill_id INT)
RETURNS NUMERIC AS $$
    SELECT GREATEST(
             COALESCE(b.amount, 0) - COALESCE(b.discount, 0) + COALESCE(b.tax, 0)
             - COALESCE((SELECT SUM(p.amount) FROM payment p WHERE p.bill_id = b.bill_id), 0),
             0)
    FROM billing b
    WHERE b.bill_id = p_bill_id;
$$ LANGUAGE sql STABLE;


-- Percentage of rooms currently occupied in one ward
CREATE OR REPLACE FUNCTION fn_ward_occupancy(p_ward_id INT)
RETURNS NUMERIC AS $$
DECLARE
    v_total    INT;
    v_occupied INT;
BEGIN
    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE LOWER(status) = 'occupied')
    INTO v_total, v_occupied
    FROM room
    WHERE ward_id = p_ward_id;

    IF v_total = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND(v_occupied * 100.0 / v_total, 1);
END;
$$ LANGUAGE plpgsql STABLE;


-- Number of active (not cancelled/rejected) appointments of a doctor in the last N days
CREATE OR REPLACE FUNCTION fn_doctor_recent_appointments(p_doctor_id INT, p_days INT DEFAULT 30)
RETURNS INT AS $$
    SELECT COUNT(*)::INT
    FROM appointment
    WHERE doctor_id = p_doctor_id
      AND appt_date >= CURRENT_DATE - p_days
      AND COALESCE(status, 'pending') NOT IN ('cancelled', 'rejected');
$$ LANGUAGE sql STABLE;


-- =====================================================================
-- 3) TRIGGERS
-- =====================================================================

-- ---- 3a) VALIDATION: a doctor cannot have two active appointments at the same date + time
CREATE OR REPLACE FUNCTION trg_fn_appointment_no_double_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.doctor_id IS NULL OR NEW.appt_date IS NULL OR NEW.appt_time IS NULL THEN
        RETURN NEW;
    END IF;

    IF COALESCE(NEW.status, 'pending') IN ('cancelled', 'rejected', 'completed') THEN
        RETURN NEW;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM appointment a
        WHERE a.doctor_id = NEW.doctor_id
          AND a.appt_date = NEW.appt_date
          AND a.appt_time = NEW.appt_time
          AND COALESCE(a.status, 'pending') NOT IN ('cancelled', 'rejected', 'completed')
          AND a.appt_id IS DISTINCT FROM NEW.appt_id
    ) THEN
        RAISE EXCEPTION 'This doctor already has an appointment at that date and time'
            USING ERRCODE = 'MC409';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointment_no_double_booking ON appointment;

CREATE TRIGGER trg_appointment_no_double_booking
BEFORE INSERT OR UPDATE OF doctor_id, appt_date, appt_time ON appointment
FOR EACH ROW
EXECUTE FUNCTION trg_fn_appointment_no_double_booking();


-- ---- 3b) SHADOW LOG: every change or deletion of a bill (money) is recorded
CREATE OR REPLACE FUNCTION trg_fn_billing_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status   IS DISTINCT FROM NEW.status
        OR OLD.amount   IS DISTINCT FROM NEW.amount
        OR OLD.discount IS DISTINCT FROM NEW.discount THEN
            INSERT INTO billing_audit
                (bill_id, action, old_status, new_status,
                 old_amount, new_amount, old_discount, new_discount)
            VALUES
                (OLD.bill_id, 'UPDATE', OLD.status, NEW.status,
                 OLD.amount, NEW.amount, OLD.discount, NEW.discount);
        END IF;
        RETURN NEW;
    END IF;

    -- DELETE
    INSERT INTO billing_audit
        (bill_id, action, old_status, old_amount, old_discount)
    VALUES
        (OLD.bill_id, 'DELETE', OLD.status, OLD.amount, OLD.discount);

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_billing_audit ON billing;

CREATE TRIGGER trg_billing_audit
AFTER UPDATE OR DELETE ON billing
FOR EACH ROW
EXECUTE FUNCTION trg_fn_billing_audit();


-- ---- 3c) CONSISTENCY: approving a blood request takes the units out of stock
--          (fails if the bank does not have enough, so stock can never go negative)
CREATE OR REPLACE FUNCTION trg_fn_blood_request_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
        UPDATE blood_bank
        SET available_quantity = available_quantity - NEW.quantity,
            last_updated = CURRENT_TIMESTAMP
        WHERE bank_id = NEW.bank_id
          AND available_quantity >= NEW.quantity;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Not enough blood in stock to approve this request'
                USING ERRCODE = 'MC409';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blood_request_stock ON blood_request;

CREATE TRIGGER trg_blood_request_stock
BEFORE UPDATE OF status ON blood_request
FOR EACH ROW
EXECUTE FUNCTION trg_fn_blood_request_stock();


-- =====================================================================
-- 4) PROCEDURES  (multi-table workflows)
--    They do NOT commit by themselves: the Node server runs
--    BEGIN -> CALL -> COMMIT (or ROLLBACK if the procedure raised an error).
-- =====================================================================

-- ---- 4a) Admit a patient: admission row + room row
CREATE OR REPLACE PROCEDURE sp_admit_patient(
    p_adm_id   INT,
    p_room_id  INT,
    p_staff_id INT,
    p_adm_date DATE,
    p_charge   NUMERIC,
    p_notes    TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_status      VARCHAR;
    v_room_status VARCHAR;
BEGIN
    SELECT status INTO v_status
    FROM admission WHERE adm_id = p_adm_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Admission not found' USING ERRCODE = 'MC404';
    END IF;

    IF v_status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'This admission was already handled' USING ERRCODE = 'MC409';
    END IF;

    SELECT status INTO v_room_status
    FROM room WHERE room_id = p_room_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found' USING ERRCODE = 'MC404';
    END IF;

    IF LOWER(COALESCE(v_room_status, '')) <> 'available' THEN
        RAISE EXCEPTION 'Selected room is not available' USING ERRCODE = 'MC409';
    END IF;

    UPDATE admission
    SET room_id  = p_room_id,
        adm_date = COALESCE(p_adm_date, CURRENT_DATE),
        charge   = COALESCE(p_charge, charge),
        notes    = COALESCE(p_notes, notes),
        status   = 'admitted',
        staff_id = p_staff_id
    WHERE adm_id = p_adm_id;

    UPDATE room SET status = 'occupied' WHERE room_id = p_room_id;
END;
$$;


-- ---- 4b) Discharge a patient: admission row + free the room
CREATE OR REPLACE PROCEDURE sp_discharge_patient(p_adm_id INT)
LANGUAGE plpgsql AS $$
DECLARE
    v_status  VARCHAR;
    v_room_id INT;
BEGIN
    SELECT status, room_id INTO v_status, v_room_id
    FROM admission WHERE adm_id = p_adm_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Admission not found' USING ERRCODE = 'MC404';
    END IF;

    IF v_status IS DISTINCT FROM 'admitted' THEN
        RAISE EXCEPTION 'Only admitted patients can be discharged' USING ERRCODE = 'MC409';
    END IF;

    UPDATE admission
    SET status = 'discharged', discharge_date = CURRENT_DATE
    WHERE adm_id = p_adm_id;

    IF v_room_id IS NOT NULL THEN
        UPDATE room SET status = 'available' WHERE room_id = v_room_id;
    END IF;
END;
$$;


-- ---- 4c) Create a bill: billing row + billing_surgery / billing_labtest row
--          returns the new bill id in the INOUT parameter
CREATE OR REPLACE PROCEDURE sp_create_bill(
    p_source_type TEXT,
    p_source_id   INT,
    p_staff_id    INT,
    p_amount      NUMERIC,
    p_discount    NUMERIC,
    p_tax         NUMERIC,
    INOUT p_bill_id INT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_appt INT := NULL;
    v_adm  INT := NULL;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be above 0' USING ERRCODE = 'MC400';
    END IF;

    IF COALESCE(p_discount, 0) < 0 OR COALESCE(p_tax, 0) < 0 THEN
        RAISE EXCEPTION 'Discount and tax cannot be negative' USING ERRCODE = 'MC400';
    END IF;

    IF COALESCE(p_discount, 0) > p_amount THEN
        RAISE EXCEPTION 'Discount cannot be more than the amount' USING ERRCODE = 'MC400';
    END IF;

    -- lock the source row so two billing staff cannot bill the same item together
    IF p_source_type = 'appointment' THEN
        PERFORM 1 FROM appointment WHERE appt_id = p_source_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Item not found' USING ERRCODE = 'MC404'; END IF;
        IF EXISTS (SELECT 1 FROM billing WHERE appt_id = p_source_id) THEN
            RAISE EXCEPTION 'A bill already exists for this item' USING ERRCODE = 'MC409';
        END IF;
        v_appt := p_source_id;

    ELSIF p_source_type = 'admission' THEN
        PERFORM 1 FROM admission WHERE adm_id = p_source_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Item not found' USING ERRCODE = 'MC404'; END IF;
        IF EXISTS (SELECT 1 FROM billing WHERE adm_id = p_source_id) THEN
            RAISE EXCEPTION 'A bill already exists for this item' USING ERRCODE = 'MC409';
        END IF;
        v_adm := p_source_id;

    ELSIF p_source_type = 'surgery' THEN
        PERFORM 1 FROM surgery WHERE surgery_id = p_source_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Item not found' USING ERRCODE = 'MC404'; END IF;
        IF EXISTS (SELECT 1 FROM billing_surgery WHERE surgery_id = p_source_id) THEN
            RAISE EXCEPTION 'A bill already exists for this item' USING ERRCODE = 'MC409';
        END IF;

    ELSIF p_source_type = 'labtest' THEN
        PERFORM 1 FROM labtest WHERE test_id = p_source_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Item not found' USING ERRCODE = 'MC404'; END IF;
        IF EXISTS (SELECT 1 FROM billing_labtest WHERE test_id = p_source_id) THEN
            RAISE EXCEPTION 'A bill already exists for this item' USING ERRCODE = 'MC409';
        END IF;

    ELSE
        RAISE EXCEPTION 'Invalid bill type' USING ERRCODE = 'MC400';
    END IF;

    INSERT INTO billing (adm_id, appt_id, staff_id, bill_date, amount, discount, tax, status)
    VALUES (v_adm, v_appt, p_staff_id, CURRENT_DATE, p_amount,
            COALESCE(p_discount, 0), COALESCE(p_tax, 0), 'pending')
    RETURNING bill_id INTO p_bill_id;

    IF p_source_type = 'surgery' THEN
        INSERT INTO billing_surgery (bill_id, surgery_id) VALUES (p_bill_id, p_source_id);
    ELSIF p_source_type = 'labtest' THEN
        INSERT INTO billing_labtest (bill_id, test_id) VALUES (p_bill_id, p_source_id);
    END IF;
END;
$$;


-- =====================================================================
-- 5) QUICK CHECK (optional): all should return without errors
-- =====================================================================
-- SELECT fn_ward_occupancy(1);
-- SELECT fn_bill_balance(1);
-- SELECT fn_doctor_recent_appointments(1, 30);
-- SELECT * FROM billing_audit ORDER BY audit_id DESC;