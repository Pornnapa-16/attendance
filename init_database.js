require('dotenv').config();
const { pool, initDatabase } = require('./database');

async function setupDatabase() {
    try {
        console.log('🔄 กำลังเชื่อมต่อไปยัง Railway Database...\n');
        
        // Test connection
        const client = await pool.connect();
        console.log('✅ เชื่อมต่อสำเร็จ!\n');
        client.release();

        // สร้างตารางทั้งหมด
        console.log('📋 กำลังสร้างตารางในฐานข้อมูล...\n');
        await initDatabase();
        
        console.log('\n✅ สร้างตารางทั้งหมดเสร็จสิ้น!\n');
        console.log('📝 ตารางที่ถูกสร้าง:');
        console.log('   - teachers');
        console.log('   - courses');
        console.log('   - students');
        console.log('   - attendance');
        console.log('   - course_enrollments');
        console.log('   - app_settings\n');
        
        // ตรวจสอบตาราง
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('✅ ตรวจสอบแล้ว: พบตารางทั้งหมด', result.rows.length, 'ตาราง\n');
        result.rows.forEach(row => {
            console.log('   ✓', row.table_name);
        });

        process.exit(0);
    } catch (err) {
        console.error('\n❌ เกิดข้อผิดพลาด:', err.message);
        console.error('\n💡 ตรวจสอบ:');
        console.error('   1. DATABASE_URL ใน .env ถูกต้องหรือไม่');
        console.error('   2. Railway database ทำงานอยู่หรือไม่\n');
        process.exit(1);
    }
}

setupDatabase();
