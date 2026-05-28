const express = require('express');
const router = express.Router();
const protect = require('../middleware/authmiddleware');
const {
    applyExpense,
    getMyExpenses,
    getAllExpenses,
    updateExpenseStatus
} = require('../controllers/expenseController');

router.post('/apply', protect, applyExpense);
router.get('/my', protect, getMyExpenses);
router.get('/all', protect, getAllExpenses);
router.put('/:id/status', protect, updateExpenseStatus);

module.exports = router;
