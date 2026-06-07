const express = require('express');
const router = express.Router();
const protect = require('../middleware/authmiddleware');
const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus,
    bcLeaveBalance,
    cancelMyLeave
} = require('../controllers/leaveController');

router.post('/apply', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.get('/all', protect, getAllLeaves);
router.get('/bc-balance', protect, bcLeaveBalance);
router.put('/:id/status', protect, updateLeaveStatus);
router.delete('/:id', protect, cancelMyLeave);

module.exports = router;
