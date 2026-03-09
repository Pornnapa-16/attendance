/**
 * Routes สำหรับการเช็คชื่อ (RFID Scan + Attendance Records)
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// สแกน RFID และบันทึกการเข้าเรียน (Public API สำหรับ ESP32)
router.post('/attendance/scan', async (req, res) => {
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
                return res.status(404).json({ 
                    error: 'ไม่พบรหัสนักเรียน',
                    message: 'ไม่พบข้อมูลนักเรียน กรุณาลงทะเบียน RFID'
                });
            }

            const student = studentResult.rows[0];

            // ดึงข้อมูลวิชา
            const courseResult = await pool.query(
                'SELECT * FROM courses WHERE id = $1',
                [targetCourseId]
            );

            if (courseResult.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'ไม่พบวิชา',
                    message: 'ไม่พบวิชานี้ในระบบ'
                });
            }

            const course = courseResult.rows[0];

            // ตรวจสอบว่านักเรียนลงทะเบียนวิชานี้หรือไม่
            const enrollResult = await pool.query(
                'SELECT * FROM course_enrollments WHERE course_id = $1 AND student_id = $2',
                [targetCourseId, student.id]
            );

            // ถ้าไม่มี enrollment ให้ auto-enroll
            if (enrollResult.rows.length === 0) {
                try {
                    await pool.query(
                        'INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2)',
                        [targetCourseId, student.id]
                    );
                    console.log(`✅ Auto-enrolled: ${student.name} (${student.student_id}) in course ${targetCourseId}`);
                } catch (enrollErr) {
                    console.warn('⚠️ Auto-enroll warning:', enrollErr.message);
                    // ไม่ส่ง error เพราะอาจจะอยู่แล้ว
                }
            }

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

            // ตรวจสอบว่ามีการเช็คชื่อซ้ำไหม (ในวันเดียวกันของวิชาเดียวกัน)
            const today = new Date().toISOString().split('T')[0];
            const dupResult = await pool.query(
                `SELECT a.*, s.student_id, s.name 
                 FROM attendance a
                 JOIN students s ON a.student_id = s.id
                 WHERE a.course_id = $1 AND a.student_id = $2 AND a.scan_date = $3`,
                [targetCourseId, student.id, today]
            );

            if (dupResult.rows.length > 0) {
                const existing = dupResult.rows[0];
                const scanTime = new Date(existing.scan_time).toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                return res.status(409).json({
                    error: 'เช็คชื่อซ้ำ',
                    message: `${student.name} (${student.student_id}) เช็คชื่อไปแล้ววันนี้`,
                    detail: `เช็คชื่อเมื่อ: ${scanTime} - สถานะ: ${existing.status}`,
                    student: {
                        id: student.id,
                        student_id: student.student_id,
                        name: student.name
                    },
                    existingAttendance: {
                        time: scanTime,
                        status: existing.status
                    }
                });
            }

            // บันทึกการเข้าเรียน
            const insertResult = await pool.query(
                `INSERT INTO attendance (course_id, student_id, scan_date, scan_time, status)
                 VALUES ($1, $2, $3, NOW(), $4)
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

// ดึงรายการเช็คชื่อของวิชา (Public API)
router.get('/attendance/:courseId', async (req, res) => {
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
router.get('/attendance/:courseId/stats', requireAuth, async (req, res) => {
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

module.exports = router;
