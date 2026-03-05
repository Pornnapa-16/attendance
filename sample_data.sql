-- =====================================================
-- Sample Data for RFID Attendance System
-- Run this AFTER creating tables (database_schema.sql)
-- =====================================================

-- 1. เพิ่มอาจารย์ตัวอย่าง
-- Password: password123 (hashed with bcrypt)
INSERT INTO teachers (username, password, name, email) VALUES
('teacher01', '$2a$10$YourBcryptHashedPasswordHere', 'อาจารย์สมชาย เรืองศรี', 'somchai@school.th'),
('teacher02', '$2a$10$YourBcryptHashedPasswordHere', 'อาจารย์สมหญิง ใจดี', 'somying@school.th')
ON CONFLICT (username) DO NOTHING;

-- 2. เพิ่มวิชาเรียน
INSERT INTO courses (teacher_id, course_code, name, start_time, end_time, late_threshold, absent_threshold) VALUES
(1, 'MATH101', 'คณิตศาสตร์พื้นฐาน', '09:00', '10:30', 5, 15),
(1, 'ENG201', 'ภาษาอังกฤษ', '10:45', '12:15', 5, 15),
(2, 'SCI301', 'วิทยาศาสตร์', '13:00', '14:30', 5, 15);

-- 3. เพิ่มนักเรียน (course_id = 1 สำหรับ MATH101)
INSERT INTO students (course_id, student_id, name, rfid_card) VALUES
(1, '6501001', 'นักเรียน คนที่ 1', 'a1b2c3d4'),
(1, '6501002', 'นักเรียน คนที่ 2', 'e5f6g7h8'),
(1, '6501003', 'นักเรียน คนที่ 3', 'i9j0k1l2'),
(1, '6501004', 'นักเรียน คนที่ 4', 'm3n4o5p6'),
(1, '6501005', 'นักเรียน คนที่ 5', 'q7r8s9t0');

-- 4. เพิ่มนักเรียนในวิชา ENG201 (course_id = 2)
INSERT INTO students (course_id, student_id, name, rfid_card) VALUES
(2, '6501101', 'นักเรียน คนที่ 101', 'u1v2w3x4'),
(2, '6501102', 'นักเรียน คนที่ 102', 'y5z6a7b8'),
(2, '6501103', 'นักเรียน คนที่ 103', 'c9d0e1f2');

-- 5. ตั้งค่าวิชาปัจจุบัน (Active Course)
INSERT INTO app_settings (key, value) VALUES 
('active_course_id', '1')
ON CONFLICT (key) DO UPDATE SET value = '1', updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- ตรวจสอบข้อมูล
-- =====================================================

-- ดูอาจารย์ทั้งหมด
-- SELECT * FROM teachers;

-- ดูวิชาทั้งหมด
-- SELECT * FROM courses;

-- ดูนักเรียนทั้งหมด
-- SELECT s.*, c.name as course_name FROM students s
-- JOIN courses c ON s.course_id = c.id;

-- ดูการตั้งค่า
-- SELECT * FROM app_settings;
