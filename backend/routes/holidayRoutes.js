const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { list, years } = require('../controllers/holidayController');

router.get('/years', protect, years);
router.get('/', protect, list);

module.exports = router;
