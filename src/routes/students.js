/**
 * Routes สำหรับจัดการนักเรียน (Students CRUD + Bulk Import)
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

function parseStudentNumber(value) {
    if (value === undefined || value === null || String(value).trim() === '') {
        return null;
    }

    const parsed = Number.parseInt(String(value).trim(), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return NaN;
    }

    return parsed;
}

// ดึงรายการนักเรียนทั้งหมด (รองรับ filter ตาม course_id)
router.get('/students', requireAuth, async (req, res) => {
    try {
        const { courseId } = req.query;
        
        let query = 'SELECT * FROM students';
        let params = [];
        
        if (courseId) {
            query += ' WHERE course_id = $1';
            params.push(courseId);
        }
        
        query += ' ORDER BY student_number NULLS LAST, student_id';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Get students error:', err);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลนักเรียนได้' });
    }
});

// เพิ่มนักเรียนใหม่
router.post('/students', requireAuth, async (req, res) => {
    try {
        const { course_id, student_id, rfid_card, name, student_number } = req.body;

        if (!course_id || !student_id || !rfid_card || !name) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const normalizedStudentId = String(student_id).trim();
        const normalizedName = String(name).trim();
        const normalizedRfid = String(rfid_card).trim().toLowerCase();
        const parsedStudentNumber = parseStudentNumber(student_number);

        if (Number.isNaN(parsedStudentNumber)) {
            return res.status(400).json({ error: 'เลขที่ต้องเป็นตัวเลขมากกว่า 0' });
        }

        const result = await pool.query(
            'INSERT INTO students (course_id, student_number, student_id, rfid_card, name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [course_id, parsedStudentNumber, normalizedStudentId, normalizedRfid, normalizedName]
        );

        res.json({ success: true, studentId: result.rows[0].id });
    } catch (err) {
        console.error('Create student error:', err);
        if (err.code === '23505') { // UNIQUE constraint violation
            return res.status(400).json({ error: 'รหัสนักเรียนหรือ RFID ซ้ำ' });
        }
        res.status(500).json({ error: 'ไม่สามารถเพิ่มนักเรียนได้' });
    }
});

// แก้ไขข้อมูลนักเรียน
router.put('/students/:id', requireAuth, async (req, res) => {
    try {
        const { student_id, rfid_card, name, student_number } = req.body;
        const studentDbId = req.params.id;

        if (!student_id || !rfid_card || !name) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const normalizedStudentId = String(student_id).trim();
        const normalizedName = String(name).trim();
        const normalizedRfid = String(rfid_card).trim().toLowerCase();
        const parsedStudentNumber = parseStudentNumber(student_number);

        if (Number.isNaN(parsedStudentNumber)) {
            return res.status(400).json({ error: 'เลขที่ต้องเป็นตัวเลขมากกว่า 0' });
        }

        const result = await pool.query(
            'UPDATE students SET student_number = $1, student_id = $2, rfid_card = $3, name = $4 WHERE id = $5',
            [parsedStudentNumber, normalizedStudentId, normalizedRfid, normalizedName, studentDbId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'ไม่พบนักเรียนที่ต้องการแก้ไข' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Update student error:', err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'รหัสนักเรียนหรือ RFID ซ้ำ' });
        }
        res.status(500).json({ error: 'ไม่สามารถแก้ไขนักเรียนได้' });
    }
});

// ลบนักเรียน
router.delete('/students/:id', requireAuth, async (req, res) => {
    try {
        const studentDbId = req.params.id;

        // ลบการลงทะเบียนวิชา
        await pool.query('DELETE FROM course_enrollments WHERE student_id = $1', [studentDbId]);
        
        // ลบการบันทึกเช็คชื่อ
        await pool.query('DELETE FROM attendance WHERE student_id = $1', [studentDbId]);
        
        // ลบนักเรียน
        const result = await pool.query('DELETE FROM students WHERE id = $1', [studentDbId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'ไม่พบนักเรียนที่ต้องการลบ' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Delete student error:', err);
        res.status(500).json({ error: 'ไม่สามารถลบนักเรียนได้' });
    }
});

// นำเข้านักเรียนจากไฟล์ (Bulk import)
router.post('/students/bulk', requireAuth, async (req, res) => {
    try {
        const { students } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
        }

        let imported = 0;
        let errors = 0;

        for (const student of students) {
            try {
                const { course_id, student_id, rfid_card, name, student_number } = student;

                if (!course_id || !student_id || !rfid_card || !name) {
                    errors++;
                    continue;
                }

                const normalizedStudentId = String(student_id).trim();
                const normalizedName = String(name).trim();
                const normalizedRfid = String(rfid_card).trim().toLowerCase();
                const parsedStudentNumber = parseStudentNumber(student_number);

                if (Number.isNaN(parsedStudentNumber)) {
                    errors++;
                    continue;
                }

                // Check if student already exists
                const existingStudent = await pool.query(
                    'SELECT id FROM students WHERE course_id = $1 AND student_id = $2',
                    [course_id, normalizedStudentId]
                );

                if (existingStudent.rows.length > 0) {
                    // Update existing student
                    await pool.query(
                        'UPDATE students SET rfid_card = $1, name = $2, student_number = COALESCE($3, student_number) WHERE id = $4',
                        [normalizedRfid, normalizedName, parsedStudentNumber, existingStudent.rows[0].id]
                    );
                } else {
                    // Insert new student
                    await pool.query(
                        'INSERT INTO students (course_id, student_number, student_id, rfid_card, name) VALUES ($1, $2, $3, $4, $5)',
                        [course_id, parsedStudentNumber, normalizedStudentId, normalizedRfid, normalizedName]
                    );
                }

                imported++;
            } catch (err) {
                console.error('Error importing student:', err);
                errors++;
            }
        }

        res.json({ 
            success: true, 
            imported: imported,
            errors: errors,
            message: `นำเข้า ${imported} นักเรียน${errors > 0 ? `, มีข้อผิดพลาด ${errors} รายการ` : ''}`
        });
    } catch (err) {
        console.error('Bulk import error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการนำเข้า' });
    }
});

module.exports = router;
