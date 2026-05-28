const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authmiddleware');
const {
    createSuperAdmin,
    getRegisterToken,
    register,
    login,
    refreshToken,
    verifyToken,
    logout,
    changePassword,
    me,
    updateMe
} = require('../controllers/authController');

router.post('/create-super-admin', createSuperAdmin);
router.post('/get-register-token', getRegisterToken);
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/verify-token', protect, verifyToken);
router.post('/logout', protect, logout);
router.post('/change-password', protect, changePassword);
router.get('/me', protect, me);
router.put('/me', protect, updateMe);

module.exports = router;
