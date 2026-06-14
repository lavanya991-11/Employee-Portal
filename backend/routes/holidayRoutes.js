const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { list } = require('../controllers/holidayController');

router.get('/', protect, list);

module.exports = router;
