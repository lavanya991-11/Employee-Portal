const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authmiddleware');
const { get, update } = require('../controllers/settingController');

router.get('/', protect, get);
router.put('/', protect, authorize('admin', 'super-admin'), update);

module.exports = router;
