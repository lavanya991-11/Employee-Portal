const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { load, list } = require('../controllers/amortizationController');

router.get('/', protect, list);
router.post('/', protect, load);

module.exports = router;
