# Deployment to Railway

Railway ให้บริการ hosting + managed PostgreSQL database - perfect สำหรับระบบนี้

## Step 1: สร้าง Railway Account

1. ไปที่ https://railway.app
2. Sign up ด้วย **GitHub** (ง่ายสุด)
   - หรือ Email + Password

---

## Step 2: เตรียม GitHub Repository

ต้องอัปโหลดโค้ดขึ้น GitHub ก่อน:

```bash
cd c:\Users\Pornnapa\attendance
git init
git add .
git commit -m "Initial commit - Attendance System"
git remote add origin https://github.com/YOUR_USERNAME/attendance
git push -u origin main
```

**หมายเหตุ:** ต้องมี GitHub account และ repository แล้ว

---

## Step 3: สร้าง PostgreSQL Database บน Railway

1. ไปที่ https://railway.app/dashboard
2. คลิก **+ New Project**
3. เลือก **Provision PostgreSQL**
4. รอสักครู่ให้ สร้างเสร็จ

---

## Step 4: สร้าง Node.js App Service

1. ใน Project → **+ Add Service**
2. เลือก **GitHub Repo** 
3. เลือก `YOUR_USERNAME/attendance` repository
4. เลือก Branch: `main`

Railway จะ auto-deploy!

---

## Step 5: ตั้ง Environment Variables

1. ไปที่ **Variables** ของ Node.js service
2. Railway จะ auto-add `DATABASE_URL` (ที่ connect ไป PostgreSQL)
3. เพิ่มตัวแปรอื่น:
   ```
   NODE_ENV=production
   PORT=3000
   ```

---

## Step 6: ตรวจสอบการ Deploy

1. ไปที่ **Deployments** tab
2. ดู log - ควรจะ `✓ ฐานข้อมูล PostgreSQL พร้อมใช้งาน`
3. ไปที่ **Settings** → ดู public domain (เช่น `https://attendance-abc123.railway.app`)

---

## Step 7: เพิ่มข้อมูลครั้งแรก

เมื่อ app ทำงาน ให้:

1. เปิด `https://YOUR_DOMAIN/`
2. สร้างอาจารย์ใหม่:
   - ใช้ script: `node add_data.js` (local machine ก่อน)
   - หรือ สแกน RFID ตรง ESP32

---

## Step 8: อัปเดต ESP32 Firmware

เปลี่ยน `SERVER_URL` ใน `ESP32_RFID_Reader_v2.ino`:

```cpp
const char* SERVER_URL = "https://YOUR_RAILWAY_DOMAIN";
```

Upload ใหม่ไป ESP32

---

## Tips & Troubleshooting

### ❌ Build Failed
ดู log ใน Railway dashboard → Deployments

### ❌ Database Connection Error
- ตรวจสอบว่า PostgreSQL service ทำงาน
- ดู `DATABASE_URL` ใน Variables ถูกไหม

### ❌ App Restarting Constantly
- เช็ค logs มีข้อผิดพลาด error ไหม
- อาจจำเป็นต้อง `npm install` packages

### ✅ Custom Domain (Optional)
- Railway → Domain → Add Custom Domain
- ชี้ DNS ไปที่ Railway servers

### ✅ Backup Database (Recommended)
- ใช้ `pg_dump` เป็นระยะ
- หรือ export ข้อมูล via Railway dashboard

---

## Update Code & Redeploy

1. แก้ไขโค้ด local
2. Commit & Push ขึ้น GitHub:
   ```bash
   git add .
   git commit -m "Feature description"
   git push
   ```
3. Railway จะ auto-redeploy อัตโนมัติ!

---

## Cost

- **Free tier:**
  - $5/month credit
  - PostgreSQL + Node.js ใช้แล้วหมด
  
- **Pay as you go:**
  - เกิน free tier จ่าย ~$0.40/hour

ส่วนใหญ่ฟรี! 🎉
