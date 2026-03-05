require('dotenv').config();
const { Pool } = require('pg');

// สร้าง connection pool
let pool;

if (process.env.DATABASE_URL) {
    // ใช้ CONNECTION STRING (สำหรับ Railway, Heroku, etc)
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
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
    console.error('Unexpected error on idle client', err);
});

// สร้างตารางในฐานข้อมูล
async function initDatabase() {
    try {
        const client = await pool.connect();

        // ตารางอาจารย์
        await client.query(`
            CREATE TABLE IF NOT EXISTS teachers (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // ตารางวิชา
        await client.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                teacher_id INTEGER NOT NULL,
                course_code VARCHAR(255),
                name VARCHAR(255) NOT NULL,
                start_time VARCHAR(5),
                end_time VARCHAR(5),
                late_threshold INTEGER DEFAULT 5,
                absent_threshold INTEGER DEFAULT 15,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES teachers(id)
            )
        `);

        // ตารางนักเรียน
        await client.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL,
                student_id VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                rfid_card VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id),
                UNIQUE(course_id, student_id)
            )
        `);

        // ตารางการลงทะเบียนเรียน
        await client.query(`
            CREATE TABLE IF NOT EXISTS course_enrollments (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id),
                FOREIGN KEY (student_id) REFERENCES students(id),
                UNIQUE(course_id, student_id)
            )
        `);

        // ตารางบันทึกการเข้าเรียน
        await client.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                scan_date DATE NOT NULL,
                scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50),
                FOREIGN KEY (course_id) REFERENCES courses(id),
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        `);

        // ตารางการตั้งค่าแอป
        await client.query(`
            CREATE TABLE IF NOT EXISTS app_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        client.release();
        console.log('✓ ฐานข้อมูล PostgreSQL พร้อมใช้งาน');
    } catch (err) {
        console.error('❌ เกิดข้อผิดพลาดในการตั้ง Database:', err);
        process.exit(1);
    }
}

module.exports = { pool, initDatabase };
