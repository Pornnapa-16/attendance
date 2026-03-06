/**
 * จัดการ Reset Token สำหรับการรีเซ็ตรหัสผ่าน
 */

// In-memory store สำหรับ reset tokens (expires ใน 15 นาที)
const resetTokens = new Map();

/**
 * สร้าง random token
 */
function generateResetToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * เก็บ reset token พร้อม teacher ID
 */
function storeResetToken(teacherId, username) {
    const token = generateResetToken();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 นาที
    resetTokens.set(token, { teacherId, username, expiresAt });
    return token;
}

/**
 * ตรวจสอบและลบ expired tokens
 */
function validateResetToken(token) {
    const tokenData = resetTokens.get(token);
    if (!tokenData) return null;
    
    if (Date.now() > tokenData.expiresAt) {
        resetTokens.delete(token);
        return null;
    }
    
    return tokenData;
}

/**
 * ลบ token ที่ใช้แล้ว
 */
function deleteResetToken(token) {
    resetTokens.delete(token);
}

module.exports = {
    storeResetToken,
    validateResetToken,
    deleteResetToken
};
