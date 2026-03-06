/**
 * Routes สำหรับจัดการวิชา (Courses CRUD + Active Course)
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// ดึงรายการวิชาทั้งหมดของอาจารย์
router.get('/courses', requireAuth, async (req, res) => {
    try{
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
router.get('/courses/:id', requireAuth, async (req, res) => {
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
router.post('/courses', requireAuth, async (req, res) => {
    try {
        const { course_code, name, start_time, end_time, late_threshold, absent_threshold } = req.body;

        if (!name || !start_time || !end_time) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const normalizedCourseCode = course_code ? String(course_code).trim() : null;

        const result = await pool.query(
            `INSERT INTO courses (teacher_id, course_code, name, start_time, end_time, late_threshold, absent_threshold) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id`,
            [req.session.teacherId, normalizedCourseCode, name, start_time, end_time, late_threshold || 5, absent_threshold || 15]
        );

        res.json({ success: true, courseId: result.rows[0].id });
    } catch (err) {
        console.error('Create course error:', err);
        if (err.code === '23505') { // Unique constraint violation
            return res.status(400).json({ error: 'รหัสวิชานี้มีอยู่แล้ว' });
        }
        res.status(500).json({ error: 'ไม่สามารถสร้างวิชาได้' });
    }
});

// แก้ไขวิชา
router.put('/courses/:id', requireAuth, async (req, res) => {
    try {
        const { course_code, name, start_time, end_time, late_threshold, absent_threshold } = req.body;

        const normalizedCourseCode = course_code ? String(course_code).trim() : null;

        const result = await pool.query(
            `UPDATE courses 
             SET course_code = $1, name = $2, start_time = $3, end_time = $4, late_threshold = $5, absent_threshold = $6
             WHERE id = $7 AND teacher_id = $8`,
            [normalizedCourseCode, name, start_time, end_time, late_threshold, absent_threshold, req.params.id, req.session.teacherId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'ไม่พบวิชานี้' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Update course error:', err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'รหัสวิชานี้มีอยู่แล้ว' });
        }
        res.status(500).json({ error: 'ไม่สามารถแก้ไขวิชาได้' });
    }
});

// ลบวิชา
router.delete('/courses/:id', requireAuth, async (req, res) => {
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

// ดึงวิชาปัจจุบันสำหรับหน้าเว็บ (ต้องล็อกอิน)
router.get('/active-course', requireAuth, async (req, res) => {
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
router.put('/active-course', requireAuth, async (req, res) => {
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

// ดึงวิชาปัจจุบันสำหรับ ESP32 (ไม่ต้องล็อกอิน - Public API)
router.get('/public/active-course', async (req, res) => {
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

module.exports = router;
