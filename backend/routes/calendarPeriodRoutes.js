const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { list, scan, byCalendar, removeAll, remove } = require('../controllers/calendarPeriodController');

router.get('/', protect, list);
router.get('/by-calendar', protect, byCalendar);
router.post('/scan', protect, scan);
router.delete('/all', protect, removeAll);
router.delete('/:id', protect, remove);

module.exports = router;
