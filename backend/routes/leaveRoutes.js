const express = require('express');
const router = express.Router();
const protect = require('../middleware/authmiddleware');
const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus
} = require('../controllers/leaveController');

router.post('/apply', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.get('/all', protect, getAllLeaves);
router.put('/:id/status', protect, updateLeaveStatus);

module.exports = router;
