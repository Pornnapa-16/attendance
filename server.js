/**
 * ระบบเช็คชื่อด้วย RFID - Main Entry Point
 * 
 * โครงสร้างโปรเจค:
 * - src/config/ -> การตั้งค่าฐานข้อมูล
 * - src/middleware/ -> middleware สำหรับ authentication
 * - src/routes/ -> แยก routes ตามฟังก์ชัน
 * - src/utils/ -> ฟังก์ชันช่วยเหลือต่างๆ
 * - public/ -> ไฟล์ HTML, CSS, JavaScript สำหรับ frontend
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { initDatabase } = require('./src/config/database');

// Import routes
const pagesRoutes = require('./src/routes/pages');
const authRoutes = require('./src/routes/auth');
const passwordRoutes = require('./src/routes/password');
const profileRoutes = require('./src/routes/profile');
const coursesRoutes = require('./src/routes/courses');
const studentsRoutes = require('./src/routes/students');
const attendanceRoutes = require('./src/routes/attendance');

const app = express();
const PORT = process.env.PORT || 3000;

// เริ่มต้นฐานข้อมูล (ไม่ block startup)
initDatabase().catch(err => {
    console.warn('⚠️  Database initialization warning:', err.message);
    console.warn('   Server will start anyway, but features may not work until DB is ready');
});

// ==================== Middleware ====================

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));

// Session management
app.use(session({
    secret: process.env.SESSION_SECRET || 'rfid-attendance-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 ชั่วโมง
}));

// ==================== Routes ====================

// HTML Pages
app.use('/', pagesRoutes);

// API Routes
app.use('/api', authRoutes);
app.use('/api', passwordRoutes);
app.use('/api', profileRoutes);
app.use('/api', coursesRoutes);
app.use('/api', studentsRoutes);
app.use('/api', attendanceRoutes);

// ==================== Error Handling ====================

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'ไม่พบหน้าที่ต้องการ' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
});

// ==================== Start Server ====================

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║      🎓  ระบบเช็คชื่อด้วย RFID - PostgreSQL             ║
║                                                          ║
║      Server running on: http://localhost:${PORT}         ║
║      Environment: ${process.env.NODE_ENV || 'development'}                            ║
║                                                          ║
║      📁 Routes organized by feature:                     ║
║         • Auth (Login, Register, Logout)                 ║
║         • Password (Forgot/Reset)                        ║
║         • Profile (View/Edit, Change Password)           ║
║         • Courses (CRUD + Active Course)                 ║
║         • Students (CRUD + Bulk Import)                  ║
║         • Attendance (RFID Scan + Records)               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
