-- ================================================
-- RFID Attendance System - Sample Data
-- PostgreSQL
-- ================================================

-- NOTE: Passwords are shown as placeholder bcrypt hashes
-- Use add_data.js script for actual data with properly hashed passwords

-- 1. Insert Teachers
INSERT INTO teachers (username, password, name, email) VALUES
('teacher01', '$2a$10$YourBcryptHashedPasswordHere', 'อาจารย์สมชาย', 'somchai@school.th')
ON CONFLICT (username) DO NOTHING;

-- 2. Insert Courses
INSERT INTO courses (teacher_id, course_code, name, start_time, end_time) VALUES
((SELECT id FROM teachers WHERE username = 'teacher01'), 'MATH101', 'คณิตศาสตร์ 1', '08:00', '09:30'),
((SELECT id FROM teachers WHERE username = 'teacher01'), 'ENG201', 'ภาษาอังกฤษ 2', '10:00', '11:30')
ON CONFLICT (course_code) DO NOTHING;

-- 3. Insert Students for MATH101
INSERT INTO students (course_id, student_id, name, rfid_card) VALUES
((SELECT id FROM courses WHERE course_code = 'MATH101'), 'STU001', 'นายแสงอรุณ', 'a1b2c3d4'),
((SELECT id FROM courses WHERE course_code = 'MATH101'), 'STU002', 'นางสาวพิมพ์', 'e5f6g7h8'),
((SELECT id FROM courses WHERE course_code = 'MATH101'), 'STU003', 'นายชัยวัฒน์', 'i9j0k1l2'),
((SELECT id FROM courses WHERE course_code = 'MATH101'), 'STU004', 'นางสาวมณฑา', 'm3n4o5p6')
ON CONFLICT (course_id, student_id) DO NOTHING;

-- 4. Insert Students for ENG201
INSERT INTO students (course_id, student_id, name, rfid_card) VALUES
((SELECT id FROM courses WHERE course_code = 'ENG201'), 'STU005', 'นายสมบูรณ์', 'q7r8s9t0'),
((SELECT id FROM courses WHERE course_code = 'ENG201'), 'STU006', 'นางสาวกมล', 'u1v2w3x4'),
((SELECT id FROM courses WHERE course_code = 'ENG201'), 'STU007', 'นายศราวุธ', 'y5z6a7b8'),
((SELECT id FROM courses WHERE course_code = 'ENG201'), 'STU008', 'นางสาวรินดา', 'c9d0e1f2')
ON CONFLICT (course_id, student_id) DO NOTHING;

-- 5. Set Active Course
INSERT INTO app_settings (key, value) VALUES
('active_course_id', (SELECT id::text FROM courses WHERE course_code = 'MATH101'))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ================================================
-- Verification
-- ================================================

-- SELECT 'Teachers:' as info; 
-- SELECT COUNT(*) as count FROM teachers;
-- SELECT 'Courses:' as info;
-- SELECT COUNT(*) as count FROM courses;
-- SELECT 'Students:' as info;
-- SELECT COUNT(*) as count FROM students;
-- SELECT 'Settings:' as info;
-- SELECT key, value FROM app_settings;
