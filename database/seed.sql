-- Sample data for MediCare Hospital Management System

-- Admin
INSERT INTO admin (username, password, role, status) VALUES
('admin', 'admin123', 'admin', 'active');

-- Departments
INSERT INTO department (dept_name, description, floor, phone, email) VALUES
('Cardiology', 'Heart and cardiovascular care', 2, '01711111111', 'cardio@medicare.com'),
('Neurology', 'Brain and nervous system', 3, '01722222222', 'neuro@medicare.com'),
('Orthopedics', 'Bone and joint treatment', 1, '01733333333', 'ortho@medicare.com'),
('General Medicine', 'General health checkups', 1, '01744444444', 'general@medicare.com');

-- Staff
INSERT INTO staffs (name, email, password, dept_id, salary, phone) VALUES
('Sarah Ahmed', 'sarah@medicare.com', 'staff123', 1, 35000, '01811111111'),
('Karim Hassan', 'karim@medicare.com', 'staff123', 2, 32000, '01822222222'),
('Nadia Islam', 'nadia@medicare.com', 'staff123', 3, 30000, '01833333333');

-- Doctors
INSERT INTO doctor (name, email, salary, phone, status, specialization, dept_id) VALUES
('Dr. Rahman Ali', 'rahman@medicare.com', 80000, '01911111111', 'active', 'Cardiologist', 1),
('Dr. Fatima Khan', 'fatima@medicare.com', 85000, '01922222222', 'active', 'Neurologist', 2),
('Dr. Imran Chowdhury', 'imran@medicare.com', 75000, '01933333333', 'active', 'Orthopedic Surgeon', 3),
('Dr. Ayesha Begum', 'ayesha@medicare.com', 70000, '01944444444', 'active', 'General Physician', 4);

-- Admin links
INSERT INTO admin_staff VALUES (1, 1), (1, 2), (1, 3);
INSERT INTO admin_doctor VALUES (1, 1), (1, 2), (1, 3), (1, 4);

-- Patients
INSERT INTO patient (name, email, password, phone, dob, gender, blood_group, address) VALUES
('Mohammad Karim', 'karim.p@email.com', 'patient123', '01611111111', '1990-05-15', 'Male', 'A+', 'Dhaka, Bangladesh'),
('Sabina Akter', 'sabina@email.com', 'patient123', '01622222222', '1985-08-20', 'Female', 'B+', 'Chittagong, Bangladesh'),
('Rashid Mia', 'rashid@email.com', 'patient123', '01633333333', '1978-12-10', 'Male', 'O+', 'Sylhet, Bangladesh');

-- Wards
INSERT INTO ward (dept_id, capacity, floor) VALUES
(1, 20, 2),
(2, 15, 3),
(3, 25, 1);

-- Rooms
INSERT INTO room (ward_id, room_type, floor, capacity, status) VALUES
(1, 'ICU', 2, 2, 'occupied'),
(1, 'General', 2, 4, 'available'),
(2, 'Private', 3, 1, 'available'),
(3, 'General', 1, 6, 'available');

-- Blood Bank
INSERT INTO blood_bank (blood_group, available_quantity, storage_location, expiry_date) VALUES
('A+', 50, 'Cold Storage A', '2026-12-31'),
('B+', 40, 'Cold Storage A', '2026-11-30'),
('O+', 60, 'Cold Storage B', '2026-12-15'),
('AB+', 20, 'Cold Storage B', '2026-10-31');

INSERT INTO ward_blood_supply (ward_id, bank_id, quantity) VALUES (1, 1, 10), (2, 2, 8);

INSERT INTO blood_request (staff_id, bank_id, quantity, status) VALUES (1, 1, 5, 'approved');

-- Time Slots
INSERT INTO time_slot (doctor_id, slot_date, start_time, end_time, status, room) VALUES
(1, '2026-08-10', '09:00', '09:30', 'available', 'Room 201'),
(1, '2026-08-10', '09:30', '10:00', 'booked', 'Room 201'),
(2, '2026-08-10', '10:00', '10:30', 'available', 'Room 301');

-- Appointments
INSERT INTO appointment (patient_id, doctor_id, staff_id, appt_date, appt_time, status, reason, notes) VALUES
(1, 1, 1, '2026-08-10', '09:30', 'approved', 'Chest pain checkup', 'Follow up needed'),
(2, 2, 2, '2026-08-11', '10:00', 'pending', 'Headache and dizziness', NULL);

-- Medical Items
INSERT INTO medical_item (item_name, category, unit_price, manufacturer) VALUES
('Paracetamol 500mg', 'Painkiller', 2.50, 'Square Pharma'),
('Amoxicillin 250mg', 'Antibiotic', 5.00, 'Beximco'),
('Metformin 500mg', 'Diabetes', 3.50, 'Incepta'),
('Aspirin 75mg', 'Blood Thinner', 1.50, 'Renata');

-- Prescriptions
INSERT INTO prescription (patient_id, doctor_id, date, diagnosis, advice, note) VALUES
(1, 1, '2026-08-10', 'Mild angina', 'Rest and low salt diet', 'Review in 2 weeks');

INSERT INTO prescription_item (pres_id, item_id, quantity, dosage) VALUES
(1, 1, 20, '1 tablet twice daily'),
(1, 4, 30, '1 tablet once daily');

-- Lab Tests
INSERT INTO labtest (patient_id, test_name, type, unit_price, result, date) VALUES
(1, 'ECG', 'Cardiac', 500.00, 'Normal sinus rhythm', '2026-08-10'),
(2, 'MRI Brain', 'Neurology', 5000.00, 'Pending', '2026-08-11'),
(3, 'X-Ray Leg', 'Radiology', 800.00, 'Minor fracture detected', '2026-08-09');

-- Surgeries
INSERT INTO surgery (patient_id, doctor_id, surgery_name, date, type) VALUES
(3, 3, 'Leg Fracture Fixation', '2026-08-15', 'Orthopedic'),
(1, 1, 'Angioplasty', '2026-09-01', 'Cardiac');

-- Admissions
INSERT INTO admission (patient_id, room_id, adm_date, status, charge, notes) VALUES
(1, 1, '2026-08-10', 'admitted', 5000.00, 'ICU monitoring'),
(3, 4, '2026-08-09', 'admitted', 2000.00, 'Post surgery recovery');

-- Complaints
INSERT INTO complaint (patient_id, staff_id, complaint_type, status, description) VALUES
(2, 1, 'Long waiting time', 'open', 'Waited 2 hours for appointment'),
(1, 2, 'Room cleanliness', 'resolved', 'Room was not cleaned properly');

-- Insurance
INSERT INTO insurance (patient_id, policy_number, company_name, coverage, expiry_date) VALUES
(1, 'POL-2024-001', 'Green Delta Insurance', 500000.00, '2027-01-01'),
(2, 'POL-2023-045', 'Pragati Insurance', 300000.00, '2026-06-30');

-- Billing
INSERT INTO billing (adm_id, bill_date, amount, discount, tax, status) VALUES
(1, '2026-08-10', 15000.00, 1000.00, 500.00, 'partial'),
(2, '2026-08-09', 8000.00, 0, 200.00, 'unpaid');

INSERT INTO billing_labtest (bill_id, test_id) VALUES (1, 1), (2, 3);
INSERT INTO billing_surgery (bill_id, surgery_id) VALUES (2, 1);

-- Payments
INSERT INTO payment (bill_id, payment_date, amount, method, ref_no, notes) VALUES
(1, '2026-08-10', 10000.00, 'Card', 'TXN-001', 'Partial payment via insurance');
