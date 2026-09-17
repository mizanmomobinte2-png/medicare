-- MediCare Hospital Management System
-- Database Schema (matches ERD)

DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS billing_surgery CASCADE;
DROP TABLE IF EXISTS billing_labtest CASCADE;
DROP TABLE IF EXISTS billing CASCADE;
DROP TABLE IF EXISTS insurance CASCADE;
DROP TABLE IF EXISTS complaint CASCADE;
DROP TABLE IF EXISTS admission CASCADE;
DROP TABLE IF EXISTS surgery CASCADE;
DROP TABLE IF EXISTS labtest CASCADE;
DROP TABLE IF EXISTS prescription_item CASCADE;
DROP TABLE IF EXISTS prescription CASCADE;
DROP TABLE IF EXISTS medical_item CASCADE;
DROP TABLE IF EXISTS appointment CASCADE;
DROP TABLE IF EXISTS time_slot CASCADE;
DROP TABLE IF EXISTS blood_request CASCADE;
DROP TABLE IF EXISTS ward_blood_supply CASCADE;
DROP TABLE IF EXISTS blood_bank CASCADE;
DROP TABLE IF EXISTS room CASCADE;
DROP TABLE IF EXISTS ward CASCADE;
DROP TABLE IF EXISTS admin_doctor CASCADE;
DROP TABLE IF EXISTS admin_staff CASCADE;
DROP TABLE IF EXISTS doctor CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS patient CASCADE;
DROP TABLE IF EXISTS department CASCADE;
DROP TABLE IF EXISTS admin CASCADE;

-- ============ ADMIN ============
CREATE TABLE admin (
    user_id     SERIAL PRIMARY KEY,
    username    VARCHAR(50) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) DEFAULT 'admin',
    last_login  TIMESTAMP,
    status      VARCHAR(20) DEFAULT 'active'
);

-- ============ DEPARTMENT ============
CREATE TABLE department (
    dept_id     SERIAL PRIMARY KEY,
    dept_name   VARCHAR(100) NOT NULL,
    description TEXT,
    floor       INT,
    phone       VARCHAR(20),
    email       VARCHAR(100)
);

-- ============ STAFF ============
CREATE TABLE staff (
    staff_id    SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) UNIQUE,
    password    VARCHAR(255),
    dept_id     INT REFERENCES department(dept_id) ON DELETE SET NULL,
    salary      DECIMAL(10,2),
    phone       VARCHAR(20)
);

-- ============ DOCTOR ============
CREATE TABLE doctor (
    doctor_id       SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(100) UNIQUE,
    salary          DECIMAL(10,2),
    phone           VARCHAR(20),
    status          VARCHAR(20) DEFAULT 'active',
    specialization  VARCHAR(100),
    dept_id         INT REFERENCES department(dept_id) ON DELETE SET NULL
);

-- Admin manages staff and doctors
CREATE TABLE admin_staff (
    admin_id INT REFERENCES admin(user_id) ON DELETE CASCADE,
    staff_id INT REFERENCES staff(staff_id) ON DELETE CASCADE,
    PRIMARY KEY (admin_id, staff_id)
);

CREATE TABLE admin_doctor (
    admin_id  INT REFERENCES admin(user_id) ON DELETE CASCADE,
    doctor_id INT REFERENCES doctor(doctor_id) ON DELETE CASCADE,
    PRIMARY KEY (admin_id, doctor_id)
);

-- ============ PATIENT ============
CREATE TABLE patient (
    patient_id  SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) UNIQUE,
    password    VARCHAR(255),
    phone       VARCHAR(20),
    dob         DATE,
    gender      VARCHAR(10),
    blood_group VARCHAR(5),
    address     TEXT
);

-- ============ WARD & ROOM ============
CREATE TABLE ward (
    ward_id   SERIAL PRIMARY KEY,
    dept_id   INT REFERENCES department(dept_id) ON DELETE SET NULL,
    capacity  INT,
    floor     INT
);

CREATE TABLE room (
    room_id   SERIAL PRIMARY KEY,
    ward_id   INT REFERENCES ward(ward_id) ON DELETE SET NULL,
    room_type VARCHAR(50),
    floor     INT,
    capacity  INT,
    status    VARCHAR(20) DEFAULT 'available'
);

-- ============ BLOOD BANK ============
CREATE TABLE blood_bank (
    bank_id            SERIAL PRIMARY KEY,
    blood_group        VARCHAR(5) NOT NULL,
    available_quantity INT DEFAULT 0,
    storage_location   VARCHAR(100),
    last_updated       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date        DATE
);

CREATE TABLE ward_blood_supply (
    supply_id   SERIAL PRIMARY KEY,
    ward_id     INT REFERENCES ward(ward_id) ON DELETE CASCADE,
    bank_id     INT REFERENCES blood_bank(bank_id) ON DELETE CASCADE,
    quantity    INT,
    supply_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE blood_request (
    request_id   SERIAL PRIMARY KEY,
    staff_id     INT REFERENCES staff(staff_id) ON DELETE SET NULL,
    bank_id      INT REFERENCES blood_bank(bank_id) ON DELETE SET NULL,
    quantity     INT,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status       VARCHAR(20) DEFAULT 'pending'
);

-- ============ TIME SLOT ============
CREATE TABLE time_slot (
    slot_id    SERIAL PRIMARY KEY,
    doctor_id  INT REFERENCES doctor(doctor_id) ON DELETE CASCADE,
    slot_date  DATE,
    start_time TIME,
    end_time   TIME,
    status     VARCHAR(20) DEFAULT 'available',
    room       VARCHAR(50)
);

-- ============ APPOINTMENT ============
CREATE TABLE appointment (
    appt_id    SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patient(patient_id) ON DELETE CASCADE,
    doctor_id  INT REFERENCES doctor(doctor_id) ON DELETE SET NULL,
    staff_id   INT REFERENCES staff(staff_id) ON DELETE SET NULL,
    appt_date  DATE,
    appt_time  TIME,
    status     VARCHAR(20) DEFAULT 'pending',
    reason     TEXT,
    notes      TEXT
);

-- ============ MEDICAL ITEM & PRESCRIPTION ============
CREATE TABLE medical_item (
    item_id      SERIAL PRIMARY KEY,
    item_name    VARCHAR(100) NOT NULL,
    category     VARCHAR(50),
    unit_price   DECIMAL(10,2),
    manufacturer VARCHAR(100)
);

CREATE TABLE prescription (
    pres_id    SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patient(patient_id) ON DELETE CASCADE,
    doctor_id  INT REFERENCES doctor(doctor_id) ON DELETE SET NULL,
    date       DATE DEFAULT CURRENT_DATE,
    diagnosis  TEXT,
    advice     TEXT,
    note       TEXT
);

CREATE TABLE prescription_item (
    id       SERIAL PRIMARY KEY,
    pres_id  INT REFERENCES prescription(pres_id) ON DELETE CASCADE,
    item_id  INT REFERENCES medical_item(item_id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    dosage   VARCHAR(100)
);

-- ============ LAB TEST ============
CREATE TABLE labtest (
    test_id    SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patient(patient_id) ON DELETE CASCADE,
    test_name  VARCHAR(100),
    type       VARCHAR(50),
    unit_price DECIMAL(10,2),
    result     TEXT,
    date       DATE DEFAULT CURRENT_DATE
);

-- ============ SURGERY ============
CREATE TABLE surgery (
    surgery_id   SERIAL PRIMARY KEY,
    patient_id   INT REFERENCES patient(patient_id) ON DELETE CASCADE,
    doctor_id    INT REFERENCES doctor(doctor_id) ON DELETE SET NULL,
    surgery_name VARCHAR(100),
    date         DATE,
    type         VARCHAR(50)
);

-- ============ ADMISSION ============
CREATE TABLE admission (
    adm_id         SERIAL PRIMARY KEY,
    patient_id     INT REFERENCES patient(patient_id) ON DELETE CASCADE,
    room_id        INT REFERENCES room(room_id) ON DELETE SET NULL,
    adm_date       DATE DEFAULT CURRENT_DATE,
    discharge_date DATE,
    status         VARCHAR(20) DEFAULT 'admitted',
    charge         DECIMAL(10,2),
    notes          TEXT
);

-- ============ COMPLAINT ============
CREATE TABLE complaint (
    complaint_id   SERIAL PRIMARY KEY,
    patient_id     INT REFERENCES patient(patient_id) ON DELETE CASCADE,
    staff_id       INT REFERENCES staff(staff_id) ON DELETE SET NULL,
    complaint_type VARCHAR(100),
    date           DATE DEFAULT CURRENT_DATE,
    status         VARCHAR(20) DEFAULT 'open',
    description    TEXT
);

-- ============ INSURANCE ============
CREATE TABLE insurance (
    insurance_id   SERIAL PRIMARY KEY,
    patient_id     INT REFERENCES patient(patient_id) ON DELETE CASCADE,
    policy_number  VARCHAR(50),
    company_name   VARCHAR(100),
    coverage       DECIMAL(10,2),
    expiry_date    DATE
);

-- ============ BILLING & PAYMENT ============
CREATE TABLE billing (
    bill_id   SERIAL PRIMARY KEY,
    adm_id    INT REFERENCES admission(adm_id) ON DELETE SET NULL,
    bill_date DATE DEFAULT CURRENT_DATE,
    amount    DECIMAL(10,2),
    discount  DECIMAL(10,2) DEFAULT 0,
    tax       DECIMAL(10,2) DEFAULT 0,
    status    VARCHAR(20) DEFAULT 'unpaid'
);

CREATE TABLE billing_labtest (
    bill_id INT REFERENCES billing(bill_id) ON DELETE CASCADE,
    test_id INT REFERENCES labtest(test_id) ON DELETE CASCADE,
    PRIMARY KEY (bill_id, test_id)
);

CREATE TABLE billing_surgery (
    bill_id    INT REFERENCES billing(bill_id) ON DELETE CASCADE,
    surgery_id INT REFERENCES surgery(surgery_id) ON DELETE CASCADE,
    PRIMARY KEY (bill_id, surgery_id)
);

CREATE TABLE payment (
    payment_id   SERIAL PRIMARY KEY,
    bill_id      INT REFERENCES billing(bill_id) ON DELETE CASCADE,
    payment_date DATE DEFAULT CURRENT_DATE,
    amount       DECIMAL(10,2),
    method       VARCHAR(50),
    ref_no       VARCHAR(100),
    notes        TEXT
);
