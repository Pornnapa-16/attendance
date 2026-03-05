# 🚀 Deploy ไปยัง Render.com (ฟรี 100%)

## ✨ ข้อดีของ Render Free Tier
- ✅ **ฟรีตลอดชีพ** - ไม่มีค่าใช้จ่าย
- ✅ **PostgreSQL Database** - 90 วัน (ข้อมูลไม่หาย)
- ✅ **HTTPS/SSL** - ได้ฟรีอัตโนมัติ
- ✅ **Auto Deploy** - Git push → Deploy อัตโนมัติ
- ⚠️ **ข้อจำกัด:** Server หลับถ้าไม่มีคนเข้า 15 นาที (ตื่นใช้เวลา 30-50 วินาที)

---

## 📋 ขั้นตอนการ Deploy

### **ขั้นที่ 1: สร้างบัญชี Render**
1. ไปที่ https://render.com
2. คลิก **Sign Up** → เลือก **GitHub**
3. เชื่อมต่อกับ GitHub account ของคุณ
4. ✅ **ฟรีตลอด** ไม่ต้องใส่บัตร

---

### **ขั้นที่ 2: สร้าง PostgreSQL Database**

1. ใน Render Dashboard คลิก **New +** → เลือก **PostgreSQL**
2. ตั้งค่า:
   - **Name:** `attendance-db`
   - **Database:** `attendance_db`
   - **User:** `attendance_user`
   - **Region:** `Singapore` (ใกล้ไทยสุด)
   - **Plan:** **Free** ✅
3. คลิก **Create Database**
4. รอประมาณ 1-2 นาที จนสถานะเป็น **Available**
5. **คัดลอก Internal Database URL:**
   - เลื่อนหาข้อมูลด้านล่าง
   - หาส่วน **Internal Database URL**
   - คลิก **Copy** (รูปแบบ: `postgresql://attendance_user:xxx@xxx/attendance_db`)
   - **บันทึกไว้** จะใช้ในขั้นต่อไป

---

### **ขั้นที่ 3: สร้างตารางในฐานข้อมูล**

#### **วิธีที่ 1: ใช้ Script (แนะนำ)**

1. เปิดไฟล์ `.env` ในเครื่อง
2. เพิ่มบรรทัดนี้ (แทน URL จริงที่ copy มา):
   ```env
   DATABASE_URL=postgresql://attendance_user:xxx@dpg-xxx-a.singapore-postgres.render.com/attendance_db
   ```

3. รันคำสั่งใน PowerShell:
   ```powershell
   node init_database.js
   ```
   
4. ถ้าสำเร็จจะเห็น:
   ```
   ✅ เชื่อมต่อสำเร็จ!
   ✅ สร้างตารางทั้งหมดเสร็จสิ้น!
   ```

5. เพิ่มข้อมูลตัวอย่าง:
   ```powershell
   node add_data.js
   ```
   สร้าง: **teacher01 / password123** และนักเรียน 8 คน

#### **วิธีที่ 2: ใช้ SQL Shell ใน Render**

1. เข้า Render → **attendance-db** → แท็บ **Shell**
2. รันคำสั่ง `psql`
3. Copy เนื้อหาทั้งหมดจากไฟล์ `database_schema.sql`
4. Paste ลงใน Shell และ Enter
5. ถ้าเห็น `CREATE TABLE` 6 ครั้ง = สำเร็จ ✅

---

### **ขั้นที่ 4: Deploy Web Service**

1. ใน Render Dashboard คลิก **New +** → เลือก **Web Service**
2. เชื่อมต่อ GitHub Repository:
   - คลิก **Connect a repository**
   - เลือกชื่อ repo ของคุณ (เช่น `Pornnapa-16/attendance`)
   - คลิก **Connect**

3. ตั้งค่า Web Service:
   - **Name:** `attendance-system`
   - **Region:** `Singapore`
   - **Branch:** `main` (หรือ `master`)
   - **Root Directory:** ปล่อยว่าง
   - **Runtime:** **Node**
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** **Free** ✅

4. **เพิ่ม Environment Variables:**
   คลิก **Add Environment Variable** และเพิ่ม:
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | `[paste Internal Database URL ที่ copy ไว้]` |
   | `PORT` | `10000` |

5. คลิก **Create Web Service**
6. รอ Deploy ประมาณ 2-5 นาที
7. ถ้าเห็น **Live** สีเขียว = สำเร็จ! ✅

---

### **ขั้นที่ 5: ทดสอบเว็บไซต์**

1. คลิกที่ URL ด้านบน (มีหน้าตา: `https://attendance-system-xxxx.onrender.com`)
2. ควรเห็นหน้า Login
3. ทดลอง Login:
   - **Username:** `teacher01`
   - **Password:** `password123`
4. ถ้าเข้าได้ = ใช้งานได้แล้ว! 🎉

---

## 🔧 การใช้งานหลัง Deploy

### **อัพเดทโค้ด ESP32**

แก้ไขไฟล์ `ESP32_RFID_Reader.ino`:

```cpp
const char* SERVER_URL = "https://attendance-system-xxxx.onrender.com";
```

แล้วอัปโหลดเข้า ESP32 ใหม่

---

### **Auto Deploy เมื่อ Push Git**

Render จะ Deploy อัตโนมัติทุกครั้งที่คุณ:
```powershell
git add .
git commit -m "update code"
git push
```

ไม่ต้องทำอะไรเพิ่ม! 🚀

---

### **ตรวจสอบ Logs**

ใน Render Dashboard:
- เข้า Web Service → แท็บ **Logs**
- ดูข้อความ error หรือการทำงาน real-time

---

## ⚠️ ข้อควรรู้เกี่ยวกับ Free Tier

### **Server จะหลับเมื่อไร?**
- ไม่มีคนเข้าใช้งาน **15 นาที**
- Server จะ "Spin Down" (หยุดทำงาน)

### **Server จะตื่นเมื่อไร?**
- มีคนเข้าเว็บครั้งแรก
- ใช้เวลา **30-50 วินาที** ในการตื่น
- หลังจากนั้นทำงานปกติ

### **วิธีแก้ไขปัญหาหลับ:**

#### **ตัวเลือก 1: ใช้ Cron Job Service (ฟรี)**
ใช้ https://cron-job.org ให้ Ping URL ของคุณทุก 10 นาที:
```
https://attendance-system-xxxx.onrender.com/api/session
```

#### **ตัวเลือก 2: ยอมรับว่าหลับ**
- เหมาะกับโรงเรียนที่ใช้เฉพาะเวลาเรียน 8:00-16:00
- ครูเข้าเว็บก่อนเรียน 5 นาที → Server ตื่น
- หลังจากนั้นนักเรียนสแกนได้ทันที

---

## 💾 Backup ฐานข้อมูล

### **Export ข้อมูล:**
1. เข้า Render → **attendance-db** → **Shell**
2. รันคำสั่ง:
   ```bash
   pg_dump -U attendance_user attendance_db > backup.sql
   ```

### **Import ข้อมูลกลับ:**
```bash
psql -U attendance_user attendance_db < backup.sql
```

---

## 🆘 แก้ปัญหาที่พบบ่อย

### **ปัญหา: Deploy สำเร็จแต่เว็บเปิดไม่ได้**
✅ **แก้ไข:**
- ตรวจสอบว่าเพิ่ม `DATABASE_URL` ใน Environment Variables แล้ว
- ตรวจสอบว่าตารางถูกสร้างในฐานข้อมูลแล้ว (รัน `init_database.js`)

### **ปัญหา: Login ไม่ได้**
✅ **แก้ไข:**
- รันคำสั่ง `node add_data.js` เพื่อสร้าง teacher01 ใหม่
- รหัสผ่านต้องเป็น `password123`

### **ปัญหา: ESP32 เชื่อมต่อไม่ได้**
✅ **แก้ไข:**
- ตรวจสอบ URL ใน ESP32 ต้องเป็น `https://` (ไม่ใช่ http)
- ตรวจสอบว่า Server ไม่หลับ (เข้าเว็บก่อน)

### **ปัญหา: Database หมดอายุ 90 วัน**
✅ **แก้ไข:**
- สร้าง PostgreSQL Database ใหม่ใน Render
- Export ข้อมูลเก่า → Import เข้าใหม่
- อัพเดท `DATABASE_URL` ใน Web Service

---

## 📞 ติดต่อสำรอง

- **Render Docs:** https://render.com/docs
- **Community:** https://community.render.com
- **เช็คสถานะ:** https://status.render.com

---

## 🎯 สรุป

✅ **ฟรี 100%** - ไม่มีค่าใช้จ่าย  
✅ **ใช้งานออนไลน์** - เข้าได้จากทุกที่  
✅ **SSL/HTTPS** - ปลอดภัย  
⚠️ **Server หลับ** - แต่แก้ได้ด้วย Cron Job

เหมาะสำหรับโรงเรียนขนาดเล็ก-กลางที่ต้องการระบบฟรีและใช้งานง่าย! 🎉
