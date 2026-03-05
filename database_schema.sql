-- =====================================================
-- RFID Attendance System Database Schema
-- PostgreSQL Database Tables
-- =====================================================

-- 1. ตารางอาจารย์ (Teachers)
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ตารางวิชา (Courses)
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    course_code VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    start_time VARCHAR(5),
    end_time VARCHAR(5),
    late_threshold INTEGER DEFAULT 5,
    absent_threshold INTEGER DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- 3. ตารางนักเรียน (Students)
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    student_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    rfid_card VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(course_id, student_id)
);

-- 4. ตารางการลงทะเบียนเรียน (Course Enrollments)
CREATE TABLE IF NOT EXISTS course_enrollments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(course_id, student_id)
);

-- 5. ตารางบันทึกการเข้าเรียน (Attendance Records)
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    scan_date DATE NOT NULL,
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 6. ตารางการตั้งค่าแอป (App Settings)
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- สร้าง Indexes เพื่อเพิ่มประสิทธิภาพ
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_students_rfid_card ON students(rfid_card);
CREATE INDEX IF NOT EXISTS idx_attendance_course_date ON attendance(course_id, scan_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- =====================================================
-- ตรวจสอบตารางที่สร้าง
-- =====================================================

-- คำสั่งนี้แสดงรายการตารางทั้งหมด
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ดูโครงสร้างตาราง
-- \d teachers
-- \d courses
-- \d students
-- \d attendance
