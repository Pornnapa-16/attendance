require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const { pool, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// เริ่มต้นฐานข้อมูล
initDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'rfid-attendance-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 ชั่วโมง
}));

// Middleware: ตรวจสอบการล็อกอิน
function requireAuth(req, res, next) {
    if (req.session.teacherId) {
        next();
    } else {
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    }
}

// ==================== API สำหรับการล็อกอิน ====================

// เข้าสู่ระบบ
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await pool.query('SELECT * FROM teachers WHERE username = $1', [username]);
        const teacher = result.rows[0];

        if (!teacher) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        if (!bcrypt.compareSync(password, teacher.password)) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        req.session.teacherId = teacher.id;
        req.session.teacherName = teacher.name;
        
        res.json({ 
            success: true, 
            teacher: { 
                id: teacher.id, 
                name: teacher.name, 
                username: teacher.username 
            } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// ออกจากระบบ
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// ตรวจสอบสถานะการล็อกอิน
app.get('/api/session', (req, res) => {
    if (req.session.teacherId) {
        res.json({ 
            loggedIn: true, 
            teacherId: req.session.teacherId,
            teacherName: req.session.teacherName
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// ==================== API สำหรับจัดการวิชา ====================

// ดึงรายการวิชาทั้งหมดของอาจารย์
app.get('/api/courses', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM courses WHERE teacher_id = $1 ORDER BY created_at DESC',
            [req.session.teacherId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get courses error:', err);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลวิชาได้' });
    }
});

// ดึงข้อมูลวิชาเดียว
app.get('/api/courses/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM courses WHERE id = $1 AND teacher_id = $2',
            [req.params.id, req.session.teacherId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบวิชานี้' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get course error:', err);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลวิชาได้' });
    }
});

// สร้างวิชาใหม่
app.post('/api/courses', requireAuth, async (req, res) => {
    try {
        const { name, start_time, end_time, late_threshold, absent_threshold } = req.body;

        if (!name || !start_time || !end_time) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const result = await pool.query(
            `INSERT INTO courses (teacher_id, name, start_time, end_time, late_threshold, absent_threshold) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id`,
            [req.session.teacherId, name, start_time, end_time, late_threshold || 5, absent_threshold || 15]
        );

        res.json({ success: true, courseId: result.rows[0].id });
    } catch (err) {
        console.error('Create course error:', err);
        res.status(500).json({ error: 'ไม่สามารถสร้างวิชาได้' });
    }
});

// แก้ไขวิชา
app.put('/api/courses/:id', requireAuth, async (req, res) => {
    try {
        const { name, start_time, end_time, late_threshold, absent_threshold } = req.body;

        const result = await pool.query(
            `UPDATE courses 
             SET name = $1, start_time = $2, end_time = $3, late_threshold = $4, absent_threshold = $5
             WHERE id = $6 AND teacher_id = $7`,
            [name, start_time, end_time, late_threshold, absent_threshold, req.params.id, req.session.teacherId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'ไม่พบวิชานี้' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Update course error:', err);
        res.status(500).json({ error: 'ไม่สามารถแก้ไขวิชาได้' });
    }
});

// ลบวิชา
app.delete('/api/courses/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM courses WHERE id = $1 AND teacher_id = $2',
            [req.params.id, req.session.teacherId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Delete course error:', err);
        res.status(500).json({ error: 'ไม่สามารถลบวิชาได้' });
    }
});

// ==================== API สำหรับ RFID และการเช็คชื่อ ====================

// ดึงวิชาปัจจุบันสำหรับหน้าเว็บ (ต้องล็อกอิน)
app.get('/api/active-course', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT value FROM app_settings WHERE key = $1', ['active_course_id']);
        
        if (result.rows.length === 0 || !result.rows[0].value) {
            return res.json({ courseId: null });
        }

        const activeCourseId = parseInt(result.rows[0].value, 10);
        const courseResult = await pool.query(
            'SELECT id, name FROM courses WHERE id = $1 AND teacher_id = $2',
            [activeCourseId, req.session.teacherId]
        );

        if (courseResult.rows.length === 0) {
            return res.json({ courseId: null });
        }

        const course = courseResult.rows[0];
        res.json({
            courseId: course.id,
            courseName: course.name
        });
    } catch (err) {
        console.error('Get active course error:', err);
        res.status(500).json({ error: 'ไม่สามารถดึงวิชาปัจจุบันได้' });
    }
});

// ตั้งค่าวิชาปัจจุบันจากหน้าเว็บ
app.put('/api/active-course', requireAuth, async (req, res) => {
    try {
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({ error: 'กรุณาระบุ courseId' });
        }

        const courseResult = await pool.query(
            'SELECT id, name FROM courses WHERE id = $1 AND teacher_id = $2',
            [courseId, req.session.teacherId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบวิชานี้' });
        }

        const course = courseResult.rows[0];

        await pool.query(
            `INSERT INTO app_settings (key, value, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
            ['active_course_id', String(course.id)]
        );

        res.json({
            success: true,
            courseId: course.id,
            courseName: course.name
        });
    } catch (err) {
        console.error('Set active course error:', err);
        res.status(500).json({ error: 'ไม่สามารถบันทึกวิชาปัจจุบันได้' });
    }
});

// ดึงวิชาปัจจุบันสำหรับ ESP32 (ไม่ต้องล็อกอิน)
app.get('/api/public/active-course', async (req, res) => {
    try {
        const result = await pool.query('SELECT value FROM app_settings WHERE key = $1', ['active_course_id']);
        
        if (result.rows.length === 0 || !result.rows[0].value) {
            return res.status(404).json({ error: 'ยังไม่ได้ตั้งค่าวิชาปัจจุบัน' });
        }

        const activeCourseId = parseInt(result.rows[0].value, 10);
        const courseResult = await pool.query('SELECT id, name FROM courses WHERE id = $1', [activeCourseId]);

        if (courseResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบวิชาปัจจุบัน' });
        }

        res.json({
            courseId: courseResult.rows[0].id,
            courseName: courseResult.rows[0].name
        });
    } catch (err) {
        console.error('Get public active course error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// สแกน RFID และบันทึกการเข้าเรียน
app.post('/api/attendance/scan', async (req, res) => {
    try {
        const { rfid, courseId } = req.body;

        if (!rfid) {
            return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
        }

        const handleScanForCourse = async (targetCourseId) => {
            const normalizedRfid = String(rfid).trim().toLowerCase();

            // ค้นหานักเรียนจาก RFID
            const studentResult = await pool.query(
                'SELECT * FROM students WHERE LOWER(rfid_card) = $1',
                [normalizedRfid]
            );

            if (studentResult.rows.length === 0) {
                return res.status(404).json({ error: 'ไม่พบข้อมูลนักเรียน กรุณาลงทะเบียน RFID' });
            }

            const student = studentResult.rows[0];

            // ดึงข้อมูลวิชา
            const courseResult = await pool.query(
                'SELECT * FROM courses WHERE id = $1',
                [targetCourseId]
            );

            if (courseResult.rows.length === 0) {
                return res.status(404).json({ error: 'ไม่พบวิชานี้' });
            }

            const course = courseResult.rows[0];

            // คำนวณสถานะ (มา/สาย/ขาด)
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const classTimeParts = course.start_time.split(':');
            const classTimeMinutes = parseInt(classTimeParts[0]) * 60 + parseInt(classTimeParts[1]);

            let status;
            const diffMinutes = currentTime - classTimeMinutes;

            if (diffMinutes <= 0) {
                status = 'มา';
            } else if (diffMinutes <= course.late_threshold) {
                status = 'สาย';
            } else {
                status = 'ขาด';
            }

            // ตรวจสอบว่ามีการเช็คชื่อซ้ำไหม (ในวันเดียวกัน)
            const today = new Date().toISOString().split('T')[0];
            const dupResult = await pool.query(
                `SELECT * FROM attendance
                 WHERE course_id = $1 AND student_id = $2
                 AND DATE(scan_time) = $3`,
                [targetCourseId, student.id, today]
            );

            if (dupResult.rows.length > 0) {
                return res.status(400).json({
                    error: 'นักเรียนคนนี้เช็คชื่อแล้ววันนี้',
                    student: student,
                    existingStatus: dupResult.rows[0].status
                });
            }

            // บันทึกการเข้าเรียน
            const insertResult = await pool.query(
                `INSERT INTO attendance (course_id, student_id, scan_date, status)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [targetCourseId, student.id, today, status]
            );

            res.json({
                success: true,
                student: {
                    id: student.id,
                    student_id: student.student_id,
                    name: student.name
                },
                course: {
                    id: course.id,
                    name: course.name
                },
                status: status,
                time: new Date().toLocaleTimeString('th-TH')
            });
        };

        if (courseId) {
            return handleScanForCourse(courseId);
        }

        // ถ้า courseId ไม่มา ให้ใช้วิชาปัจจุบันจากเว็บ
        const settingResult = await pool.query(
            'SELECT value FROM app_settings WHERE key = $1',
            ['active_course_id']
        );

        if (settingResult.rows.length === 0 || !settingResult.rows[0].value) {
            return res.status(400).json({ error: 'ยังไม่ได้ตั้งค่าวิชาปัจจุบันในเว็บ' });
        }

        return handleScanForCourse(parseInt(settingResult.rows[0].value, 10));
    } catch (err) {
        console.error('Scan error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// ดึงรายการเช็คชื่อของวิชา
app.get('/api/attendance/:courseId', requireAuth, async (req, res) => {
    try {
        const { date } = req.query;
        const courseId = req.params.courseId;

        let query = `
            SELECT a.*, s.student_id, s.name, s.rfid_card
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE a.course_id = $1
        `;
        const params = [courseId];
        let paramCount = 1;

        if (date) {
            paramCount++;
            query += ` AND DATE(a.scan_time) = $${paramCount}`;
            params.push(date);
        }

        query += ' ORDER BY a.scan_time DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Get attendance error:', err);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการเช็คชื่อได้' });
    }
});

// ดึงสถิติการเข้าเรียน
app.get('/api/attendance/:courseId/stats', requireAuth, async (req, res) => {
    try {
        const courseId = req.params.courseId;

        const result = await pool.query(
            `SELECT
                s.id,
                s.student_id,
                s.name,
                COUNT(CASE WHEN a.status = 'มา' THEN 1 END)::int as present,
                COUNT(CASE WHEN a.status = 'สาย' THEN 1 END)::int as late,
                COUNT(CASE WHEN a.status = 'ขาด' THEN 1 END)::int as absent,
                COUNT(*)::int as total
             FROM students s
             LEFT JOIN attendance a ON s.id = a.student_id AND a.course_id = $1
             WHERE s.course_id = $1
             GROUP BY s.id
             ORDER BY s.student_id`,
            [courseId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Get stats error:', err);
        res.status(500).json({ error: 'ไม่สามารถดึงสถิติได้' });
    }
});

// ==================== API สำหรับจัดการนักเรียน ====================

// ดึงรายการนักเรียนทั้งหมด
app.get('/api/students', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM students ORDER BY student_id');
        res.json(result.rows);
    } catch (err) {
        console.error('Get students error:', err);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลนักเรียนได้' });
    }
});

// เพิ่มนักเรียนใหม่
app.post('/api/students', requireAuth, async (req, res) => {
    try {
        const { course_id, student_id, rfid_card, name } = req.body;

        if (!course_id || !student_id || !rfid_card || !name) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const normalizedStudentId = String(student_id).trim();
        const normalizedName = String(name).trim();
        const normalizedRfid = String(rfid_card).trim().toLowerCase();

        const result = await pool.query(
            'INSERT INTO students (course_id, student_id, rfid_card, name) VALUES ($1, $2, $3, $4) RETURNING id',
            [course_id, normalizedStudentId, normalizedRfid, normalizedName]
        );

        res.json({ success: true, studentId: result.rows[0].id });
    } catch (err) {
        console.error('Create student error:', err);
        if (err.code === '23505') { // UNIQUE constraint violation
            return res.status(400).json({ error: 'รหัสนักเรียนหรือ RFID ซ้ำ' });
        }
        res.status(500).json({ error: 'ไม่สามารถเพิ่มนักเรียนได้' });
    }
});

// แก้ไขข้อมูลนักเรียน
app.put('/api/students/:id', requireAuth, async (req, res) => {
    try {
        const { student_id, rfid_card, name } = req.body;
        const studentDbId = req.params.id;

        if (!student_id || !rfid_card || !name) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const normalizedStudentId = String(student_id).trim();
        const normalizedName = String(name).trim();
        const normalizedRfid = String(rfid_card).trim().toLowerCase();

        const result = await pool.query(
            'UPDATE students SET student_id = $1, rfid_card = $2, name = $3 WHERE id = $4',
            [normalizedStudentId, normalizedRfid, normalizedName, studentDbId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'ไม่พบนักเรียนที่ต้องการแก้ไข' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Update student error:', err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'รหัสนักเรียนหรือ RFID ซ้ำ' });
        }
        res.status(500).json({ error: 'ไม่สามารถแก้ไขนักเรียนได้' });
    }
});

// ==================== เสิร์ฟหน้าเว็บ ====================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/attendance', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'attendance.html'));
});

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║   ระบบเช็คชื่อด้วย RFID - PostgreSQL             ║
    ║                                                   ║
    ║   เปิดเว็บไซต์ที่: http://localhost:${PORT}       ║
    ║   ข้อมูล: PostgreSQL Database                     ║
    ╚═══════════════════════════════════════════════════╝
    `);
});

module.exports = app;
