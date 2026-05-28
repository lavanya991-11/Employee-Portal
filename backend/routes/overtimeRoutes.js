const express = require('express');
const router = express.Router();
const protect = require('../middleware/authmiddleware');
const {
    applyOvertime,
    getMyOvertimes,
    getAllOvertimes,
    updateOvertimeStatus
} = require('../controllers/overtimeController');

router.post('/apply', protect, applyOvertime);
router.get('/my', protect, getMyOvertimes);
router.get('/all', protect, getAllOvertimes);
router.put('/:id/status', protect, updateOvertimeStatus);

module.exports = router;
