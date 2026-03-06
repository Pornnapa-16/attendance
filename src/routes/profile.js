/**
 * Routes สำหรับจัดการโปรไฟล์อาจารย์
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// ดึงข้อมูลโปรไฟล์
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, name, email FROM teachers WHERE id = $1',
            [req.session.teacherId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// อัปเดตข้อมูลโปรไฟล์ (ชื่อ, อีเมล)
router.put('/profile', requireAuth, async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'กรุณากรอกชื่อ-สกุล' });
        }

        const result = await pool.query(
            'UPDATE teachers SET name = $1, email = $2 WHERE id = $3 RETURNING name',
            [name.trim(), email ?email.trim() : null, req.session.teacherId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
        }

        // อัปเดต session
        req.session.teacherName = result.rows[0].name;

        res.json({ 
            success: true, 
            message: 'อัปเดตข้อมูลสำเร็จ',
            name: result.rows[0].name
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// เปลี่ยนรหัสผ่าน
router.put('/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // ตรวจสอบความยาวรหัสผ่านใหม่
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
        }

        // ตรวจสอบการยืนยันรหัสผ่าน
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'รหัสผ่านใหม่ไม่ตรงกัน' });
        }

        // ดึงข้อมูลผู้ใช้
        const result = await pool.query(
            'SELECT password FROM teachers WHERE id = $1',
            [req.session.teacherId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
        }

        // ตรวจสอบรหัสผ่านปัจจุบัน
        const teacher = result.rows[0];
        if (!bcrypt.compareSync(currentPassword, teacher.password)) {
            return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }

        // เข้ารหัสรหัสผ่านใหม่
        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        // อัปเดตรหัสผ่าน
        await pool.query(
            'UPDATE teachers SET password = $1 WHERE id = $2',
            [hashedPassword, req.session.teacherId]
        );

        res.json({ 
            success: true, 
            message: 'เปลี่ยนรหัสผ่านสำเร็จ' 
        });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

module.exports = router;
