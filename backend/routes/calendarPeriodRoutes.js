const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { list, scan } = require('../controllers/calendarPeriodController');

router.get('/', protect, list);
router.post('/scan', protect, scan);

module.exports = router;
