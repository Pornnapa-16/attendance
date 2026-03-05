# ระบบเช็คชื่อด้วย RFID

ระบบบันทึกการเข้าเรียนด้วย RFID Card พร้อมระบบเว็บแอปพลิเคชันสำหรับอาจารย์

## ฟีเจอร์หลัก

1. **ระบบล็อกอินสำหรับอาจารย์** - เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
2. **การจัดการวิชา** - สร้างและตั้งค่าวิชาเรียน
3. **การตั้งค่าเวลา** - กำหนดเวลาเข้าเรียน, เวลาสาย, และเวลาขาด
4. **บันทึกการเข้าเรียน** - เมื่อนักเรียนแสกน RFID จะบันทึกข้อมูลและแสดงสถานะ
5. **แสดงผลแบบเรียลไทม์** - อาจารย์เห็นผลการเช็คชื่อแบบเรียลไทม์

## ความต้องการ

- **Node.js** v14 ขึ้นไป
- **PostgreSQL** v12 ขึ้นไป

## Getting Started (เริ่มต้นอย่างรวดเร็ว)

👉 **[ดู QUICKSTART.md](./QUICKSTART.md)** - คู่มือผู้เริ่มต้น

## การติดตั้ง

### Step 1: ตั้งค่า PostgreSQL
ดูคำแนะนำละเอียดใน [POSTGRES_SETUP.md](./POSTGRES_SETUP.md)

### Step 2: ติดตั้ง Dependencies
```bash
npm install
```

### Step 3: ตั้งค่า Environment Variables
สร้างไฟล์ `.env` (สำเนาจาก `.env.example`):
```
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=attendance_db
PORT=3000
NODE_ENV=development
```

### Step 4: Migrate ข้อมูลจาก SQLite (ถ้ามี)
```bash
node migrate-sqlite-to-pg.js
```

## การใช้งาน

### เริ่มต้นเซิร์ฟเวอร์:
```bash
npm start
```

หรือ ด้วย PM2:
```bash
pm2 start server.js --name "attendance-system"
```

### เปิดเว็บไซต์:
ไปที่ `http://localhost:3000`

### ล็อกอิน:
ใช้บัญชีอาจารย์ที่ตั้งไว้ในฐานข้อมูล

## โครงสร้างฐานข้อมูล (PostgreSQL)

- **teachers** - ข้อมูลอาจารย์
- **courses** - ข้อมูลวิชาและการตั้งค่าเวลา
- **students** - ข้อมูลนักเรียนและ RFID
- **attendance** - บันทึกการเข้าเรียน
- **app_settings** - การตั้งค่าแอปพลิเคชัน

## API Endpoints

### Authentication
- `POST /api/login` - เข้าสู่ระบบ
- `POST /api/logout` - ออกจากระบบ
- `GET /api/session` - ตรวจสอบสถานะการล็อกอิน

### Courses (ต้องล็อกอิน)
- `GET /api/courses` - ดึงวิชาทั้งหมด
- `POST /api/courses` - สร้างวิชาใหม่
- `PUT /api/courses/:id` - แก้ไขวิชา
- `DELETE /api/courses/:id` - ลบวิชา

### Students
- `GET /api/students` - ดึงนักเรียนทั้งหมด
- `POST /api/students` - เพิ่มนักเรียน
- `PUT /api/students/:id` - แก้ไขนักเรียน

### Attendance (RFID Scanning)
- `POST /api/attendance/scan` - บันทึกการเช็คชื่อ
- `GET /api/attendance/:courseId` - ดึงบันทึกการเช็คชื่อ

### Active Course (สำหรับ ESP32)
- `GET /api/public/active-course` - ดึงวิชาที่ใช้งานอยู่ (ไม่ต้องล็อกอิน)
- `GET /api/active-course` - ดึงวิชาที่ใช้งานอยู่ (ต่อเมื่อล็อกอิน)
- `PUT /api/active-course` - ตั้งค่าวิชาที่ใช้งาน

## การเชื่อมต่อ ESP32 RFID Reader

ส่งข้อมูลการเช็คชื่อผ่าน HTTP POST:
```
POST http://[SERVER_IP]:3000/api/attendance/scan

Body (JSON):
{
    "rfid": "a1b2c3d4e5f6",
    "courseId": 1
}

Response:
{
    "success": true,
    "student": { "id": 1, "student_id": "001", "name": "นักเรียน ที่ 1" },
    "course": { "id": 1, "name": "วิชาคณิตศาสตร์" },
    "status": "มา",
    "time": "09:30:45"
}
```

## Troubleshooting

### Database Connection Error
ดูรายละเอียดใน [POSTGRES_SETUP.md](./POSTGRES_SETUP.md)
