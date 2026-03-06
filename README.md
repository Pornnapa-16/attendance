# 🎓 ระบบเช็คชื่อด้วย RFID

ระบบเช็คชื่ออัตโนมัติด้วย RFID Card รองรับ ESP32 + MFRC522 พร้อมระบบจัดการอาจารย์และนักเรียน

## 📁 โครงสร้างโปรเจค

```
attendance/
├── src/                          # Source code หลัก
│   ├── config/
│   │   └── database.js          # การตั้งค่าและเช่ือมต่อฐานข้อมูล PostgreSQL
│   ├── middleware/
│   │   └── auth.js              # Middleware ตรวจสอบการล็อกอิน
│   ├── routes/                   # แยก Routes ตามฟังก์ชัน
│   │   ├── pages.routes.js      # HTML Pages (Login, Dashboard, etc.)
│   │   ├── auth.routes.js       # Authentication (Login, Register, Logout)
│   │   ├── password.routes.js   # Reset Password (Forgot/Reset)
│   │   ├── profile.routes.js    # Profile Management
│   │   ├── courses.routes.js    # Courses CRUD + Active Course
│   │   ├── students.routes.js   # Students CRUD + Bulk Import
│   │   └── attendance.routes.js # RFID Scan + Attendance Records
│   └── utils/
│       └── tokenManager.js      # จัดการ Reset Token สำหรับรีเซ็ตรหัสผ่าน
│
├── public/                       # Frontend Files
│   ├── pages/
│   │   ├── auth/                # หน้าเกี่ยวกับ Authentication
│   │   │   ├── login.html
│   │   │   ├── register.html
│   │   │   ├── forgot-password.html
│   │   │   └── reset-password.html
│   │   └── teacher/             # หน้าสำหรับอาจารย์
│   │       ├── dashboard.html
│   │       └── profile.html
│   └── attendance.html          # หน้าแสดงรายการเช็คชื่อ
│
├── server.js                     # Main entry point (สั้น เรียบง่าย)
├── server.old.js                # Server เดิม (สำรองไว้)
├── .env                         # Environment variables
├── package.json                 # Dependencies
└── ESP32_RFID_Reader.ino        # Arduino code สำหรับ ESP32

```

## 🚀 การติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env`:

```env
# Database (Supabase/PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# หรือใช้แบบแยก
DB_HOST=localhost
DB_PORT=5432
DB_NAME=attendance_db
DB_USER=postgres
DB_PASSWORD=your_password

# Session
SESSION_SECRET=rfid-attendance-secret-key-2026
NODE_ENV=development
PORT=3000
```

### 3. เริ่มต้น Server

```bash
node server.js
```

Server จะรันที่: `http://localhost:3000`

## 📝 API Routes

### Authentication
- `POST /api/login` - เข้าสู่ระบบ
- `POST /api/register` - สมัครสมาชิก
- `POST /api/logout` - ออกจากระบบ
- `GET /api/session` - ตรวจสอบสถานะการล็อกอิน

### Password Management
- `POST /api/forgot-password` - ยืนยันตัวตนเพื่อรีเซ็ตรหัสผ่าน
- `POST /api/reset-password` - ตั้งรหัสผ่านใหม่

### Profile
- `GET /api/profile` - ดึงข้อมูลโปรไฟล์
- `PUT /api/profile` - อัปเดตข้อมูลโปรไฟล์
- `PUT /api/change-password` - เปลี่ยนรหัสผ่าน

### Courses
- `GET /api/courses` - ดึงรายการวิชาทั้งหมด
- `GET /api/courses/:id` - ดึงข้อมูลวิชาเดียว
- `POST /api/courses` - สร้างวิชาใหม่
- `PUT /api/courses/:id` - แก้ไขวิชา
- `DELETE /api/courses/:id` - ลบวิชา
- `GET /api/active-course` - ดึงวิชาปัจจุบัน
- `PUT /api/active-course` - ตั้งค่าวิชาปัจจุบัน
- `GET /api/public/active-course` - ดึงวิชาปัจจุบัน (สำหรับ ESP32)

### Students
- `GET /api/students?courseId=X` - ดึงรายการนักเรียน (filter ตามวิชา)
- `POST /api/students` - เพิ่มนักเรียนใหม่
- `PUT /api/students/:id` - แก้ไขนักเรียน
- `DELETE /api/students/:id` - ลบนักเรียน
- `POST /api/students/bulk` - นำเข้านักเรียนจากไฟล์

### Attendance
- `POST /api/attendance/scan` - สแกน RFID และบันทึกเช็คชื่อ (Public API)
- `GET /api/attendance/:courseId?date=YYYY-MM-DD` - ดึงรายการเช็คชื่อ
- `GET /api/attendance/:courseId/stats` - ดึงสถิติการเช็คชื่อ

## 🔧 การพัฒนาต่อ

### เพิ่ม Route ใหม่

1. สร้างไฟล์ใน `src/routes/` เช่น `example.routes.js`
2. เขียน routes ตามรูปแบบ:

```javascript
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

router.get('/example', requireAuth, async (req, res) => {
    // Your code here
});

module.exports = router;
```

3. เพิ่มใน `server.js`:

```javascript
const exampleRoutes = require('./src/routes/example.routes');
app.use('/api', exampleRoutes);
```

### เพิ่ม Middleware

สร้างไฟล์ใน `src/middleware/` และ import ใน routes ที่ต้องการใช้

## 🗄️ Database Schema

- **teachers** - ข้อมูลอาจารย์
- **courses** - ข้อมูลวิชา
- **students** - ข้อมูลนักเรียน
- **attendance** - บันทึกการเช็คชื่อ
- **course_enrollments** - การลงทะเบียนวิชา
- **app_settings** - การตั้งค่าระบบ (เก็บ active_course_id)

## 📡 ESP32 Integration

ESP32 จะเชื่อมต่อกับ API:
- `GET /api/public/active-course` - ดึงวิชาที่กำลังเปิดอยู่
- `POST /api/attendance/scan` - ส่งข้อมูล RFID เพื่อบันทึกเช็คชื่อ

## 🛠️ Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (Supabase)
- **Session**: express-session
- **Authentication**: bcryptjs
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Hardware**: ESP32 + MFRC522 RFID Reader

## 📦 Dependencies

```json
{
  "express": "^4.x",
  "express-session": "^1.x",
  "body-parser": "^1.x",
  "bcryptjs": "^2.x",
  "pg": "^8.x",
  "dotenv": "^16.x"
}
```

## 🎯 Features

- ✅ ระบบล็อกอินอาจารย์ (Username/Password)
- ✅ ระบบสมัครสมาชิก
- ✅ ระบบลืมรหัสผ่าน (Forgot/Reset Password)
- ✅ จัดการโปรไฟล์อาจารย์
- ✅ จัดการวิชา (CRUD)
- ✅ จัดการนักเรียน (CRUD + Bulk Import CSV/Excel)
- ✅ สแกน RFID Card เพื่อเช็คชื่อ
- ✅ บันทึกสถานะ (มา/สาย/ขาด) อัตโนมัติตามเวลา
- ✅ ป้องกันเช็คชื่อซ้ำ (ตรวจสอบ same day, same course)
- ✅ ตรวจสอบการลงทะเบียนวิชา (course_enrollments)
- ✅ แสดงสถิติการเข้าเรียน
- ✅ รองรับหลายวิชา (Multi-course)  
- ✅ ตั้งค่าวิชาปัจจุบัน (Active Course)

## 📄 License

MIT

## 👨‍💻 Author

RFID Attendance System - 2026
```