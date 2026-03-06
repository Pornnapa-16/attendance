/**
 * Routes สำหรับรีเซ็ตรหัสผ่าน (Forgot Password, Reset Password)
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { pool } = require('../config/database');
const { storeResetToken, validateResetToken, deleteResetToken } = require('../utils/tokenManager');

// ยืนยันตัวตนเพื่อรีเซ็ตรหัสผ่าน
router.post('/forgot-password', async (req, res) => {
    try {
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // ตรวจสอบว่ามี username และ email ตรงกันหรือไม่
        const result = await pool.query(
            'SELECT id, username FROM teachers WHERE username = $1 AND email = $2',
            [username.trim(), email.trim()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบชื่อผู้ใช้และอีเมลที่ตรงกันในระบบ' });
        }

        const teacher = result.rows[0];

        // สร้าง reset token
        const resetToken = storeResetToken(teacher.id, teacher.username);

        res.json({
            success: true,
            message: 'ยืนยันตัวตนสำเร็จ',
            resetToken: resetToken
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// ตั้งรหัสผ่านใหม่
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // ตรวจสอบความยาว password
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
        }

        // ตรวจสอบ token
        const tokenData = validateResetToken(resetToken);
        if (!tokenData) {
            return res.status(400).json({ error: 'ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอรีเซ็ตรหัสผ่านใหม่' });
        }

        // เข้ารหัสรหัสผ่านใหม่
        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        // อัพเดทรหัสผ่านในฐานข้อมูล
        await pool.query(
            'UPDATE teachers SET password = $1 WHERE id = $2',
            [hashedPassword, tokenData.teacherId]
        );

        // ลบ token ที่ใช้แล้ว
        deleteResetToken(resetToken);

        res.json({
            success: true,
            message: 'เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่'
        });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

module.exports = router;
