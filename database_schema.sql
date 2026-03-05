-- ================================================
-- RFID Attendance System - Database Schema
-- PostgreSQL
-- ================================================

-- 1. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
    course_code VARCHAR(50) UNIQUE,
    name VARCHAR(255),
    start_time VARCHAR(5),
    end_time VARCHAR(5),
    late_threshold INTEGER DEFAULT 10,
    absent_threshold INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    student_id VARCHAR(50),
    name VARCHAR(255),
    rfid_card VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, student_id)
);

-- 4. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    scan_date DATE,
    scan_time TIMESTAMP,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Course Enrollments Table
CREATE TABLE IF NOT EXISTS course_enrollments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, student_id)
);

-- 6. App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- Indexes for Performance
-- ================================================

CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_students_rfid ON students(rfid_card);
CREATE INDEX IF NOT EXISTS idx_attendance_course_id ON attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_scan_date ON attendance(scan_date);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- ================================================
-- Verification Queries
-- ================================================

-- SELECT 'teachers' as table_name FROM information_schema.tables WHERE table_name = 'teachers'
-- UNION ALL
-- SELECT 'courses' FROM information_schema.tables WHERE table_name = 'courses'
-- UNION ALL
-- SELECT 'students' FROM information_schema.tables WHERE table_name = 'students'
-- UNION ALL
-- SELECT 'attendance' FROM information_schema.tables WHERE table_name = 'attendance'
-- UNION ALL
-- SELECT 'course_enrollments' FROM information_schema.tables WHERE table_name = 'course_enrollments'
-- UNION ALL
-- SELECT 'app_settings' FROM information_schema.tables WHERE table_name = 'app_settings';
