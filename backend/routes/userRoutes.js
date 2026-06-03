const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { register, login, listAll, adminStats } = require('../controllers/userController');

router.post('/register', register);
router.post('/login', login);
router.get('/', protect, listAll);
router.get('/admin/stats', protect, adminStats);

module.exports = router;
