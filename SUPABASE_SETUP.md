# 🚀 ตั้งค่า Supabase PostgreSQL (ฟรี)

## ✨ Supabase คืออะไร?

- **PostgreSQL Cloud** - ฐานข้อมูล PostgreSQL บนคลาวด์ ฟรี 100%
- **ไม่หลับ** - ฐานข้อมูลอยู่ออนไลน์ 24/7
- **ใช้ได้กับ Node.js เดิม** - ไม่ต้องเปลี่ยนโค้ด
- **90 วัน Auto-cleanup** - ถ้าไม่ใช้มี 90 วัน ขณะไม่ลบข้อมูล

---

## 📋 ขั้นตอนการสมัคร Supabase

### **ขั้นที่ 1: สมัครบัญชี**

1. ไปที่ https://supabase.com
2. คลิก **Sign Up**
3. เลือก **GitHub** → เชื่อมต่อ GitHub account
4. ✅ ฟรี ไม่ต้องใส่บัตร

---

### **ขั้นที่ 2: สร้าง Project**

1. ใน Dashboard คลิก **New Project**
2. ตั้งค่า:
   - **Project Name:** `attendance-db` (หรือชื่ออื่นก็ได้)
   - **Database Password:** ตั้งรหัสผ่านสำหรับ `postgres` user (**บันทึกไว้!**)
   - **Region:** `Singapore` (ใกล้ไทยสุด)
3. คลิก **Create new project**
4. รอประมาณ 2-3 นาที project create เสร็จ

---

### **ขั้นที่ 3: สร้างตารางในฐานข้อมูล**

#### **วิธีที่ 1: ใช้ SQL Editor (แนะนำ)**

1. ใน Supabase Dashboard → **SQL Editor**
2. คลิก **New Query**
3. Copy และ Paste เนื้อหาทั้งหมดจากไฟล์ `database_schema.sql`
4. คลิก **Run** (หรือ Ctrl+Enter)
5. ถ้าเห็น `CREATE TABLE` สำเร็จ → ตารางถูกสร้างแล้ว ✅

#### **วิธีที่ 2: ใช้ Script (หรือการตั้งค่าแบบอื่น)**

คุณสามารถใช้คำสั่งใน PowerShell ได้ (หากมี psql ติดตั้ง):

```powershell
# รัน script สร้างตารางโดยใช้ DATABASE_URL จาก Supabase
node init_database.js
```

---

### **ขั้นที่ 4: ได้ DATABASE_URL**

1. ใน Supabase Dashboard → **Project Settings** → **Database**
2. หาส่วน **Connection string** → เลือก **URI** tab
3. **Copy** connection string (มีหน้าตา: `postgresql://postgres:xxx@xxx.supabase.co:5432/postgres`)
4. **บันทึกไว้** - จะใช้ในขั้นต่อไป

---

### **ขั้นที่ 5: เพิ่มข้อมูลตัวอย่าง**

เปิด PowerShell ที่โปรเจกต์ และสร้าง `.env` file ชั่วคราว:

```powershell
# สร้าง .env ชั่วคราว
@"
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@xxx.supabase.co:5432/postgres
"@ | Out-File .env

# รันสคริปต์เพิ่มข้อมูล
node add_data.js

# ถ้าเสร็จแล้ว ลบ .env ชั่วคราว
Remove-Item .env
```

**ผลลัพธ์:**
- ✅ สร้าง teacher01 (รหัส: password123)
- ✅ สร้าง 2 courses
- ✅ สร้าง 8 นักเรียน

---

## 🔗 ใช้ Supabase กับ Koyeb

### **ขั้นที่ 1: Copy DATABASE_URL**

จาก Supabase → **Project Settings** → **Database** → **URI**

```
postgresql://postgres:password123@xxxx.supabase.co:5432/postgres
```

### **ขั้นที่ 2: Deploy ไป Koyeb**

(ดูขั้นตอนใน [KOYEB_DEPLOYMENT.md](KOYEB_DEPLOYMENT.md))

เพิ่ม Environment Variable ใน Koyeb:
- **Key:** `DATABASE_URL`
- **Value:** `postgresql://postgres:password@xxxx.supabase.co:5432/postgres`

---

## 🆘 แก้ปัญหาที่พบบ่อย

### **ปัญหา: ลืมรหัสผ่าน Supabase**

✅ **แก้ไข:**
1. ไป **Settings** → **Database** 
2. คลิก **Reset Database Password**
3. ตั้งรหัสใหม่

### **ปัญหา: Connection Timeout**

✅ **แก้ไข:**
- ตรวจสอบ IP whitelist:
  - **Settings** → **Database** → **Connection string**
  - ถ้ามี IP restriction ให้ปิด หรือเพิ่ม IP ของ Koyeb
  - (ขั้นตอนนี้ Supabase ปกติไม่จำกัด)

### **ปัญหา: Database ยังว่างเปล่า**

✅ **แก้ไข:**
```powershell
# Copy DATABASE_URL จาก Supabase
# เพิ่มในไฟล์ .env ชั่วคราว

# รัน script
node init_database.js
node add_data.js
```

---

## 💾 Backup & Export

### **Export ฐานข้อมูล:**

ใน Supabase → **Tools** → **Backups**
- ฟรี automatic backups 7 วัน
- Manual download database backup ได้

### **Import จาก Backup:**

ใช้ SQL Editor → **New Query** → Paste SQL เก่า

---

## 🎯 สรุป

✅ **ฟรี 100%** - ไม่มีค่าใช้จ่าย  
✅ **ไม่หลับ** - ฐานข้อมูลออนไลน์ 24/7  
✅ **ใช้ PostgreSQL** - โค้ดไม่ต้องเปลี่ยน  
✅ **ลาด Admin Panel** - ใช้งาน Dashboard ใน UI

---

**ข้อมูลเพิ่มเติม:**
- Supabase Docs: https://supabase.com/docs
- PostgreSQL Guide: https://www.postgresql.org/docs/
