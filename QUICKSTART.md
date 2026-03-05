# Quick Start Guide

## เลือกวิธีการระดับสตาร์ท:

### 🚀 **วิธีที่ 1: Railway (Deploy ขึ้นเว็บ)**

**สิ่งที่ต้อง:**
- GitHub account
- Railway account (free tier OK)

**ขั้นตอน:**
1. ดู [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
2. ปฏิบัติตามขั้นตอนทีละขั้น
3. ได้ URL ออนไลน์ ~5 นาที

---

### 💻 **วิธีที่ 2: Local PostgreSQL (Develop Locally)**

**สิ่งที่ต้อง:**
- PostgreSQL ติดตั้งบนเครื่อง

**ขั้นตอน:**

#### 1. ติดตั้ง PostgreSQL
- Windows: https://www.postgresql.org/download/windows/
- Linux: `sudo apt-get install postgresql`
- macOS: `brew install postgresql`

#### 2. สร้าง Database
```bash
psql -U postgres
CREATE DATABASE attendance_db;
\q
```

#### 3. รัน Server
```bash
cd c:\Users\Pornnapa\attendance
npm install
node server.js
```

#### 4. เข้าเว็บ
http://localhost:3000

---

## การเพิ่มข้อมูลครั้งแรก

### ✅ วิธี 1: ใช้ Script (ง่ายสุด)
```bash
node add_data.js
```
ผลลัพธ์: อาจารย์ 1 คน + วิชา 2 วิชา + นักเรียน 5 คน

**ล็อกอิน:**
- Username: `teacher01`
- Password: `password123`

### ✅ วิธี 2: เพิ่มด้วย DB Browser
1. เปิด DB Browser for SQLite
2. เชื่อมต่อ PostgreSQL (ตั้งค่าให้)
3. Insert ข้อมูลด้วยมือ

---

## ESP32 RFID Configuration

ต้องอัปเดตไฟล์ `ESP32_RFID_Reader_v2.ino`:

### ถ้า Railway:
```cpp
const char* SERVER_URL = "https://your-app-name.railway.app";
```

### ถ้า Local:
```cpp
const char* SERVER_URL = "http://192.168.0.196:3000";  // เปลี่ยน IP ของเครื่อง
```

---

## Help & Support

**Problem:** Database connection failed
- ✓ ตรวจสอบว่า PostgreSQL ทำงาน
- ✓ ดูว่า .env มี DB_PASSWORD ถูกไหม

**Problem:** App not starting
- ✓ รัน `npm install` ใหม่
- ✓ ดู error message ใน terminal

**Problem:** RFID scan not working
- ✓ ตรวจสอบ SERVER_URL ใน ESP32
- ✓ ตรวจสอบ WiFi connection ของ ESP32

---

## ข้อมูลเพิ่มเติม

- [POSTGRES_SETUP.md](./POSTGRES_SETUP.md) - Local PostgreSQL setup
- [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - Railway deployment
- [README.md](./README.md) - API documentation
- [ESP32_Setup_Guide.md](./ESP32_Setup_Guide.md) - ESP32 configuration

---

**ต้องความช่วยเหลือ?** ดูเอกสารอื่น ๆ ด้านบน 👆
