const express = require('express');
const router = express.Router();
const protect = require('../middleware/authmiddleware');
const {
    applyLoan,
    getMyLoans,
    getAllLoans,
    updateLoanStatus
} = require('../controllers/loanController');

router.post('/apply', protect, applyLoan);
router.get('/my', protect, getMyLoans);
router.get('/all', protect, getAllLoans);
router.put('/:id/status', protect, updateLoanStatus);

module.exports = router;
