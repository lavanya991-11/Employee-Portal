const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { generate } = require('../controllers/payslipController');

router.get('/', protect, generate);

module.exports = router;
