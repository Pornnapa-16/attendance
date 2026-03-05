# 🚀 Deploy ไปยัง Koyeb (ฟรี 100%, ไม่หลับ)

## ✨ ข้อดีของ Koyeb

- ✅ **ฟรี 100%** - ไม่มีค่าใช้จ่าย ตลอดชีพ
- ✅ **ออนไลน์ 24/7** - ไม่หลับ ไม่มี cold start
- ✅ **ไม่ต้องใส่บัตร** - สมัครได้เลย
- ✅ **Auto Deploy** - Git push → Deploy อัตโนมัติ
- ✅ **Global CDN** - เร็ว from anywhere
- ⚠️ **1 free service ได้** - พอ 1 app

---

## 📋 ก่อน Deploy

### **ตรวจสอบต่อไปนี้:**

```
✅ GitHub repo push แล้ว (Pornnapa-16/attendance)
✅ ไฟล์ Renderfile สร้างแล้ว
✅ package.json มีค่า "start": "node server.js"
✅ DATABASE_URL จาก Supabase ได้แล้ว
```

---

## 🛠️ ตั้งค่า package.json (ถ้ายังไม่มี)

ตรวจสอบไฟล์ `package.json`:

```json
{
  "name": "rfid-attendance-system",
  "version": "1.0.0",
  "description": "RFID Attendance Management System",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "bcryptjs": "^2.4.3",
    "body-parser": "^1.20.2",
    "pg": "^8.8.0",
    "dotenv": "^16.0.3"
  }
}
```

---

## 📝 ข้อมูลเพิ่มเติม: ไฟล์ที่ Koyeb ต้องการ

### **Renderfile**
```bash
#!/bin/bash
npm install
npm start
```

📍 ไฟล์นี้อยู่ใน root ของ repo แล้ว ✅

---

## 🚀 ขั้นตอน Deploy

### **ขั้นที่ 1: สมัคร Koyeb**

1. ไปที่ https://www.koyeb.com
2. คลิก **Get Started**
3. เลือก **GitHub** → เชื่อมต่อ account
4. ✅ ฟรี ไม่ต้องใส่บัตร

---

### **ขั้นที่ 2: สร้าง Service**

1. ใน Koyeb Dashboard คลิก **Create Service**
2. เลือก **GitHub Repository**

---

### **ขั้นที่ 3: เชื่อมต่อ GitHub**

1. คลิก **Connect with GitHub**
2. ค้นหา repo: `Pornnapa-16/attendance` (หรือชื่อของคุณ)
3. คลิก **Select**
4. เลือก **Branch:** `main` (หรือ `master`)

---

### **ขั้นที่ 4: ตั้งค่า Service**

ในหน้า **Settings:**

| ค่า | ตั้งเป็น |
|-----|---------|
| **Service name** | `attendance-system` |
| **Builder** | `Buildpack` |
| **Port** | `3000` |
| **Health Check URL** | `/api/session` |
| **Health Check period** | `30 seconds` |

---

### **ขั้นที่ 5: Environment Variables**

คลิก **Add environment variable** และเพิ่ม:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres:password@xxx.supabase.co:5432/postgres` |
| `PORT` | `3000` |

**⚠️ สำคัญ:** Paste DATABASE_URL จาก Supabase (ขั้นตอนดูใน [SUPABASE_SETUP.md](SUPABASE_SETUP.md))

---

### **ขั้นที่ 6: Deploy**

1. คลิก **Create Service**
2. รอ Deploy ประมาณ 1-2 นาที
3. ถ้าเห็น **Status: Active** สีเขียว = สำเร็จ ✅

---

## ✅ ทดสอบ Web Application

1. คลิก **Public URL** ที่ Koyeb แสดง
   - มีหน้าตา: `https://attendance-system-xxxx.koyeb.app`

2. ควรเห็นหน้า **Login**

3. ทดลอง Login:
   - **Username:** `teacher01`
   - **Password:** `password123`

4. ถ้าเข้า Dashboard ได้ = ใช้งานได้แล้ว! 🎉

---

## 🔄 Auto-Deploy เมื่อ Push Git

Koyeb จะ auto-deploy ทุกครั้งที่คุณ push ไป GitHub:

```powershell
# ในเครื่องคุณ
git add .
git commit -m "update code"
git push

# Koyeb จะ auto-deploy โดยอัตโนมัติ!
```

ไม่ต้องทำอะไร ด้านเซิร์ฟเวอร์ก็จะ update 🚀

---

### **ตรวจสอบ Deployment Status**

ใน Koyeb Dashboard:
- ดู **Deployments** tab
- ดูสถานะ Build & Deploy logs
- ชาร์จดูข้อมูล Error ถ้ามี

---

## 🔧 อัพเดท ESP32 Firmware

เมื่อ Public URL ของ Koyeb ได้แล้ว:

1. เปิดไฟล์ `ESP32_RFID_Reader.ino`
2. หาบรรทัด:
   ```cpp
   const char* SERVER_URL = "http://192.168.1.xxx:3000";
   ```

3. เปลี่ยนเป็น:
   ```cpp
   const char* SERVER_URL = "https://attendance-system-xxxx.koyeb.app";
   ```

4. Upload ไป ESP32 ใหม่

---

## 📊 Monitor & Logs

### **ดูสถานะ Service:**

ใน Koyeb Dashboard:
- **Overview** - สถานะ CPU, Memory
- **Logs** - ข้อมูล print จาก server
- **Events** - ประวัติ Deploy

### **ปัญหา: Service ขึ้น error**

1. ดู **Logs** tab หาข้อความ error
2. ตรวจสอบ:
   - DATABASE_URL ถูกต้องไหม
   - Supabase ตารางถูกสร้างแล้วไหม
   - Environment variables ครบไหม

---

## 🆘 แก้ปัญหาที่พบบ่อย

### **ปัญหา: Deploy Failed**
✅ **แก้ไข:**
```
1. ดู Logs หา error message
2. ตรวจสอบ Renderfile syntax
3. ตรวจสอบ package.json ถูกต้องไหม
4. Push commit ใหม่ → auto-redeploy
```

### **ปัญหา: Connection Refused**
✅ **แก้ไข:**
- ตรวจสอบ DATABASE_URL ลอก copy ถูกไหม
- ตรวจสอบ Supabase online
- ตรวจสอบ server.js ที่บรรทัด port ว่า `process.env.PORT`

### **ปัญหา: 502 Bad Gateway**
✅ **แก้ไข:**
- Server error ดู Logs หาสาเหตุ
- Restart service: **More** → **Restart Service**
- Check database connection

### **ปัญหา: ESP32 เชื่อมต่อไม่ได้**
✅ **แก้ไข:**
```
1. ตรวจสอบ URL ต้องเป็น HTTPS (ไม่ใช่ HTTP)
2. ตรวจสอบ Server ออนไลน์ (เปิด URL ในเบราว์เซอร์)
3. ตรวจสอบ WiFi ESP32 สัญญาณดี
4. ตรวจสอบ API endpoint ตรวจสอบไหม (/api/public/active-course)
```

---

## 💡 Tips & Best Practices

### **1. ใช้ Environment Variables**
```javascript
// ✅ ถูก
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;

// ❌ ผิด
const port = 3000;  // hardcode
```

### **2. Logs ให้ Informative**
```javascript
// เพิ่ม log เพื่อ debug ง่าย
console.log(`✅ Server started on port ${port}`);
console.log(`📊 Database connected`);
```

### **3. Health Check Simple**
```javascript
// ✅ ทำให้ health check รวดเร็ว
app.get('/api/session', (req, res) => {
  res.json({ status: 'ok' });
});
```

---

## 📞 ติดต่อสำรอง

- **Koyeb Docs:** https://docs.koyeb.com
- **Community:** https://community.koyeb.com
- **Status Page:** https://status.koyeb.com

---

## 🎯 สรุป

✅ **ฟรี 100%** - ไม่มีค่าใช้จ่าย  
✅ **ไม่หลับ** - ออนไลน์ 24/7  
✅ **Auto Deploy** - Git push → Deploy อัตโนมัติ  
✅ **Simple Setup** - ไม่ซับซ้อน  

**Public URL:** `https://attendance-system-xxxx.koyeb.app`

🚀 **Ready to go!**
