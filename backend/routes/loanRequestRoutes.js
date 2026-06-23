const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { submit, listMine } = require('../controllers/loanRequestController');

router.get('/my', protect, listMine);
router.post('/', protect, submit);

module.exports = router;
