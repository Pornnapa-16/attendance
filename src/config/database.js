require('dotenv').config();
const { Pool } = require('pg');

// สร้าง connection pool
let pool;
const connectionString = process.env.DATABASE_URL;

if (connectionString) {
    // ใช้ CONNECTION STRING (สำหรับ Koyeb, Railway, Heroku, Supabase)
    pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    console.log('✅ Database mode: DATABASE_URL');
} else {
    // ใช้ individual credentials (สำหรับ local development)
    if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ DATABASE_URL is missing in production. Falling back to DB_* / localhost settings.');
    }
    pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'attendance_db'
    });
}

// Test connection
pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
});

// สร้างตารางในฐานข้อมูล
async function initDatabase() {
    try {
        // 1. Create teachers table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teachers (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // รองรับฐานข้อมูลเดิมที่ยังไม่มีคอลัมน์ใน teachers
        await pool.query(`
            ALTER TABLE teachers
            ADD COLUMN IF NOT EXISTS name VARCHAR(255)
        `);

        await pool.query(`
            ALTER TABLE teachers
            ADD COLUMN IF NOT EXISTS email VARCHAR(255)
        `);

        // 2. Create courses table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
                course_code VARCHAR(50) UNIQUE,
                name VARCHAR(255),
                start_time VARCHAR(5),
                end_time VARCHAR(5),
                late_threshold INTEGER DEFAULT 10,
                absent_threshold INTEGER DEFAULT 3,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Create students table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                student_number INTEGER,
                student_id VARCHAR(50),
                name VARCHAR(255),
                rfid_card VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(course_id, student_id)
            )
        `);

        // รองรับฐานข้อมูลเดิมที่ยังไม่มีคอลัมน์เลขที่
        await pool.query(`
            ALTER TABLE students
            ADD COLUMN IF NOT EXISTS student_number INTEGER
        `);

        // 4. Create attendance table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                scan_date DATE,
                scan_time TIMESTAMP,
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 5. Create course_enrollments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_enrollments (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(course_id, student_id)
            )
        `);

        // 6. Create app_settings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE,
                value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ สร้างตารางทั้งหมดเสร็จสิ้น!');
        return true;
    } catch (err) {
        console.error('❌ Error creating tables:', err.message);
        if (/Tenant or user not found/i.test(err.message)) {
            console.error('💡 DATABASE_URL ของ Supabase ไม่ถูกต้อง (project ref / username / host / port)');
            console.error('   ตัวอย่างที่ถูกต้อง: postgresql://postgres.<project-ref>:<password>@aws-<region>.pooler.supabase.com:6543/postgres');
        }
        throw err;
    }
}

module.exports = { pool, initDatabase };
