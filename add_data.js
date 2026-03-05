require('dotenv').config();
const { pool } = require('./database');
const bcrypt = require('bcryptjs');

async function addSampleData() {
    try {
        console.log('📝 กำลังเพิ่มข้อมูลตัวอย่าง...\n');

        // 1. เพิ่มอาจารย์
        console.log('👨‍🏫 เพิ่มอาจารย์...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const teacherResult = await pool.query(
            `INSERT INTO teachers (username, password, name, email) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (username) DO NOTHING
             RETURNING id`,
            ['teacher01', hashedPassword, 'อาจารย์สมชาย เรืองศรี', 'somchai@school.th']
        );
        
        const teacherId = teacherResult.rows.length > 0 
            ? teacherResult.rows[0].id 
            : (await pool.query('SELECT id FROM teachers WHERE username = $1', ['teacher01'])).rows[0].id;
        
        console.log(`✓ เพิ่มอาจารย์: teacher01 (ID: ${teacherId})`);

        // 2. เพิ่มวิชา
        console.log('\n📚 เพิ่มวิชาเรียน...');
        const course1Result = await pool.query(
            `INSERT INTO courses (teacher_id, course_code, name, start_time, end_time, late_threshold, absent_threshold) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id`,
            [teacherId, 'MATH101', 'คณิตศาสตร์พื้นฐาน', '09:00', '10:30', 5, 15]
        );
        const course1Id = course1Result.rows[0].id;
        console.log(`✓ เพิ่มวิชา: คณิตศาสตร์พื้นฐาน (ID: ${course1Id})`);

        const course2Result = await pool.query(
            `INSERT INTO courses (teacher_id, course_code, name, start_time, end_time, late_threshold, absent_threshold) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id`,
            [teacherId, 'ENG201', 'ภาษาอังกฤษ', '10:45', '12:15', 5, 15]
        );
        const course2Id = course2Result.rows[0].id;
        console.log(`✓ เพิ่มวิชา: ภาษาอังกฤษ (ID: ${course2Id})`);

        // 3. เพิ่มนักเรียนในวิชา MATH101
        console.log('\n👨‍🎓 เพิ่มนักเรียนในวิชา: คณิตศาสตร์พื้นฐาน...');
        const students1 = [
            [course1Id, '6501001', 'นักเรียน คนที่ 1', 'a1b2c3d4'],
            [course1Id, '6501002', 'นักเรียน คนที่ 2', 'e5f6g7h8'],
            [course1Id, '6501003', 'นักเรียน คนที่ 3', 'i9j0k1l2'],
            [course1Id, '6501004', 'นักเรียน คนที่ 4', 'm3n4o5p6'],
            [course1Id, '6501005', 'นักเรียน คนที่ 5', 'q7r8s9t0']
        ];

        for (const student of students1) {
            await pool.query(
                `INSERT INTO students (course_id, student_id, name, rfid_card) 
                 VALUES ($1, $2, $3, $4)`,
                student
            );
            console.log(`✓ ${student[2]} (RFID: ${student[3]})`);
        }

        // 4. เพิ่มนักเรียนในวิชา ENG201
        console.log('\n👨‍🎓 เพิ่มนักเรียนในวิชา: ภาษาอังกฤษ...');
        const students2 = [
            [course2Id, '6501101', 'นักเรียน คนที่ 101', 'u1v2w3x4'],
            [course2Id, '6501102', 'นักเรียน คนที่ 102', 'y5z6a7b8'],
            [course2Id, '6501103', 'นักเรียน คนที่ 103', 'c9d0e1f2']
        ];

        for (const student of students2) {
            await pool.query(
                `INSERT INTO students (course_id, student_id, name, rfid_card) 
                 VALUES ($1, $2, $3, $4)`,
                student
            );
            console.log(`✓ ${student[2]} (RFID: ${student[3]})`);
        }

        // 5. ตั้งค่าวิชาปัจจุบัน
        await pool.query(
            `INSERT INTO app_settings (key, value) 
             VALUES ($1, $2) 
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
            ['active_course_id', String(course1Id)]
        );

        console.log('\n✅ เพิ่มข้อมูลเสร็จสมบูรณ์!\n');
        console.log('📝 สรุป:');
        console.log('   Username: teacher01');
        console.log('   Password: password123');
        console.log('   วิชา: 2 วิชา');
        console.log('   นักเรียน: 8 คน\n');
        console.log('🌐 เปิดเว็บไซต์และล็อกอินได้เลย!\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ เกิดข้อผิดพลาด:', err);
        process.exit(1);
    }
}

addSampleData();
