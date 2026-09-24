-- Run once in pgAdmin / psql on the "medicare" database. Safe to re-run.

-- 1) Track who admitted a patient
ALTER TABLE admission
  ADD COLUMN IF NOT EXISTS staff_id INT REFERENCES staff(staff_id) ON DELETE SET NULL;

-- 2) Track who approved / rejected a blood request
ALTER TABLE blood_request
  ADD COLUMN IF NOT EXISTS handled_by INT REFERENCES staff(staff_id) ON DELETE SET NULL;
ALTER TABLE blood_request
  ADD COLUMN IF NOT EXISTS handled_at TIMESTAMP;

-- 3) Clean staff data
UPDATE staff SET status = 'active' WHERE status IS NULL;
UPDATE staff SET staff_role = UPPER(TRIM(staff_role)) WHERE staff_role IS NOT NULL;

-- 4) Faster "assigned to me" lookups
CREATE INDEX IF NOT EXISTS idx_appointment_staff ON appointment(staff_id);
CREATE INDEX IF NOT EXISTS idx_labtest_staff     ON labtest(staff_id);
CREATE INDEX IF NOT EXISTS idx_surgery_staff     ON surgery(staff_id);
CREATE INDEX IF NOT EXISTS idx_complaint_staff   ON complaint(staff_id);
CREATE INDEX IF NOT EXISTS idx_admission_staff   ON admission(staff_id);

-- 5) Staff whose role is empty or not one of the 7 valid keys.
--    Fix them from the admin "Staff Roles" page (or with UPDATE).
SELECT staff_id, name, email, staff_role
FROM staff
WHERE staff_role IS NULL
   OR staff_role NOT IN ('FRONT_DESK','ADMISSION','LAB_TECH','SURGERY_COORD',
                         'BLOOD_BANK','BILLING','COMPLAINT');