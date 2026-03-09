/**
 * Routes สำหรับ Authentication (Login, Register, Logout, Session)
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { pool } = require('../config/database');

// เข้าสู่ระบบ
router.post('/login', async (req, res) => {
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

// สมัครสมาชิกอาจารย์ใหม่
router.post('/register', async (req, res) => {
    try {
        const { username, password, confirmPassword, name, email } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!username || !password || !confirmPassword || !name) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // ตรวจสอบความยาว username
        if (username.length < 5) {
            return res.status(400).json({ error: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 5 ตัวอักษร' });
        }

        // ตรวจสอบความยาว password
        if (password.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
        }

        // ตรวจสอบการยืนยันรหัสผ่าน
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'รหัสผ่านไม่ตรงกัน' });
        }

        // ตรวจสอบชื่อผู้ใช้ซ้ำ
        const existingUser = await pool.query(
            'SELECT id FROM teachers WHERE username = $1',
            [username.trim()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' });
        }

        // เข้ารหัสรหัสผ่าน
        const hashedPassword = bcrypt.hashSync(password, 10);

        // บันทึกข้อมูลอาจารย์ใหม่
        const result = await pool.query(
            'INSERT INTO teachers (username, password, name, email) VALUES ($1, $2, $3, $4) RETURNING id, name, username',
            [username.trim(), hashedPassword, name.trim(), email ? email.trim() : null]
        );

        const newTeacher = result.rows[0];

        res.json({
            success: true,
            message: 'สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ',
            teacher: {
                id: newTeacher.id,
                name: newTeacher.name,
                username: newTeacher.username
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        if (err.code === '23505') { // UNIQUE constraint
            return res.status(400).json({ error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' });
        }
        if (err.code === '42703') {
            return res.status(500).json({ error: 'โครงสร้างฐานข้อมูลยังไม่อัปเดต กรุณาลองใหม่อีกครั้งใน 1 นาที' });
        }
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// ออกจากระบบ
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// ตรวจสอบสถานะการล็อกอิน
router.get('/session', (req, res) => {
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

module.exports = router;
