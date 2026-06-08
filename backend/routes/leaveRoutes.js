const express = require('express');
const router = express.Router();
const protect = require('../middleware/authmiddleware');
const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus,
    bcLeaveBalance,
    updateMyLeave,
    getOneMyLeave,
    updateLeaveStatusByRef
} = require('../controllers/leaveController');

router.post('/apply', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.get('/all', protect, getAllLeaves);
router.get('/bc-balance', protect, bcLeaveBalance);
router.get('/:id', protect, getOneMyLeave);
router.put('/:id', protect, updateMyLeave);
router.put('/:id/status', protect, updateLeaveStatus);
router.patch('/by-ref/:refNumber/status', protect, updateLeaveStatusByRef);

module.exports = router;
