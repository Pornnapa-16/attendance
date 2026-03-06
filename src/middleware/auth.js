/**
 * Middleware สำหรับตรวจสอบการล็อกอิน
 */
function requireAuth(req, res, next) {
    if (req.session.teacherId) {
        next();
    } else {
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    }
}

module.exports = { requireAuth };
