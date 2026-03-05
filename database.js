require('dotenv').config();
const { Pool } = require('pg');

// สร้าง connection pool
let pool;
const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

if (connectionString) {
    // ใช้ CONNECTION STRING (สำหรับ Koyeb, Railway, Heroku, Supabase)
    pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    console.log('✅ Database mode: DATABASE_URL');
} else if (isProduction) {
    // ป้องกัน fallback ไป localhost บน cloud ที่ทำให้ดีบั๊กยาก
    throw new Error('DATABASE_URL is required in production (Render > Environment)');
} else {
    // ใช้ individual credentials (สำหรับ local development)
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
                student_id VARCHAR(50),
                name VARCHAR(255),
                rfid_card VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(course_id, student_id)
            )
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
        throw err;
    }
}

module.exports = { pool, initDatabase };
