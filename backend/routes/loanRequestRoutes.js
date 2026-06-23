const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { submit, listMine, updateByRef } = require('../controllers/loanRequestController');

router.get('/my', protect, listMine);
router.post('/', protect, submit);
router.patch('/by-ref/:requestNo', protect, updateByRef);

module.exports = router;
