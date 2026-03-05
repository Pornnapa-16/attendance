require('dotenv').config();
const { pool } = require('./database');
const bcrypt = require('bcryptjs');

async function addSampleData() {
    try {
        console.log('🔄 กำลังเพิ่มข้อมูลตัวอย่าง...\n');

        // Hash password
        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Add teacher
        const teacherResult = await pool.query(
            'INSERT INTO teachers (username, password, name, email) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING RETURNING id',
            ['teacher01', hashedPassword, 'อาจารย์สมชาย', 'somchai@school.th']
        );
        
        if (teacherResult.rows.length > 0) {
            console.log('✓ เพิ่มอาจารย์: teacher01 (รหัส: password123)');
        } else {
            console.log('ℹ️  อาจารย์ teacher01 มีอยู่แล้ว');
        }

        // Get teacher ID (use existing if already present)
        const teacherCheck = await pool.query('SELECT id FROM teachers WHERE username = $1', ['teacher01']);
        const teacherId = teacherCheck.rows[0].id;

        // 2. Add courses
        const course1 = await pool.query(
            'INSERT INTO courses (teacher_id, course_code, name, start_time, end_time) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (course_code) DO NOTHING RETURNING id',
            [teacherId, 'MATH101', 'คณิตศาสตร์ 1', '08:00', '09:30']
        );

        const course2 = await pool.query(
            'INSERT INTO courses (teacher_id, course_code, name, start_time, end_time) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (course_code) DO NOTHING RETURNING id',
            [teacherId, 'ENG201', 'ภาษาอังกฤษ 2', '10:00', '11:30']
        );

        if (course1.rows.length > 0) console.log('✓ เพิ่มวิชา: MATH101 (คณิตศาสตร์ 1)');
        else console.log('ℹ️  วิชา MATH101 มีอยู่แล้ว');
        if (course2.rows.length > 0) console.log('✓ เพิ่มวิชา: ENG201 (ภาษาอังกฤษ 2)');
        else console.log('ℹ️  วิชา ENG201 มีอยู่แล้ว');

        // Get course IDs
        const courses = await pool.query('SELECT id, course_code FROM courses WHERE teacher_id = $1', [teacherId]);
        const mathCourse = courses.rows.find(c => c.course_code === 'MATH101');
        const engCourse = courses.rows.find(c => c.course_code === 'ENG201');

        // 3. Add students
        const students = [
            { course_id: mathCourse.id, student_id: 'STU001', name: 'นายแสงอรุณ', rfid: 'a1b2c3d4' },
            { course_id: mathCourse.id, student_id: 'STU002', name: 'นางสาวพิมพ์', rfid: 'e5f6g7h8' },
            { course_id: mathCourse.id, student_id: 'STU003', name: 'นายชัยวัฒน์', rfid: 'i9j0k1l2' },
            { course_id: mathCourse.id, student_id: 'STU004', name: 'นางสาวมณฑา', rfid: 'm3n4o5p6' },
            { course_id: engCourse.id, student_id: 'STU005', name: 'นายสมบูรณ์', rfid: 'q7r8s9t0' },
            { course_id: engCourse.id, student_id: 'STU006', name: 'นางสาวกมล', rfid: 'u1v2w3x4' },
            { course_id: engCourse.id, student_id: 'STU007', name: 'นายศราวุธ', rfid: 'y5z6a7b8' },
            { course_id: engCourse.id, student_id: 'STU008', name: 'นางสาวรินดา', rfid: 'c9d0e1f2' }
        ];

        for (const student of students) {
            await pool.query(
                'INSERT INTO students (course_id, student_id, name, rfid_card) VALUES ($1, $2, $3, $4) ON CONFLICT (course_id, student_id) DO NOTHING',
                [student.course_id, student.student_id, student.name, student.rfid]
            );
        }

        console.log('✓ เพิ่มนักเรียน: 8 คน');

        // 4. Set active course
        await pool.query(
            "INSERT INTO app_settings (key, value) VALUES ('active_course_id', $1) ON CONFLICT (key) DO UPDATE SET value = $2",
            [mathCourse.id, mathCourse.id]
        );
        console.log('✓ ตั้งค่าวิชาที่ใช้งาน: MATH101\n');

        console.log('✅ เพิ่มข้อมูลเสร็จสิ้น!\n');
        console.log('📊 ข้อมูลตัวอย่าง:');
        console.log('   - อาจารย์: 1 คน (teacher01)');
        console.log('   - วิชา: 2 วิชา');
        console.log('   - นักเรียน: 8 คน');
        console.log('   - รหัสผ่านทั้งหมด: password123\n');

        console.log('✅ พร้อมทดสอบ! Login: teacher01 / password123\n');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ เกิดข้อผิดพลาด:', err.message);
        process.exit(1);
    }
}

addSampleData();
