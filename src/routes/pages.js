/**
 * Routes สำหรับ HTML Pages
 */
const express = require('express');
const path = require('path');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// หน้า Home -> redirect ไป login
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'pages', 'auth', 'login.html'));
});

// หน้า Login
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'pages', 'auth', 'login.html'));
});

// หน้า Register
router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'pages', 'auth', 'register.html'));
});

// หน้าลืมรหัสผ่าน
router.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'pages', 'auth', 'forgot-password.html'));
});

// หน้าตั้งรหัสผ่านใหม่
router.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'pages', 'auth', 'reset-password.html'));
});

// หน้า Dashboard (ต้องล็อกอิน)
router.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'pages', 'teacher', 'dashboard.html'));
});

// หน้าโปรไฟล์ (ต้องล็อกอิน)
router.get('/profile', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'pages', 'teacher', 'profile.html'));
});

// หน้า Attendance (รองรับ URL เดิม: /attendance?courseId=...)
router.get('/attendance', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'attendance.html'));
});

// รองรับ URL แบบ path param: /attendance/:courseId
router.get('/attendance/:courseId', (req, res) => {
    res.redirect(`/attendance?courseId=${encodeURIComponent(req.params.courseId)}`);
});

module.exports = router;
