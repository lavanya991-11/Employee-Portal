const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authmiddleware');
const { list, sync, removeAll, remove } = require('../controllers/loanProductController');

// Admin-only: loan products are management data.
const adminOnly = [protect, authorize('admin', 'super-admin')];

// Lookup is available to any authenticated user (used by the Apply Loan dropdown).
router.get('/lookup', protect, list);

router.get('/', adminOnly, list);
router.post('/sync', adminOnly, sync);
router.delete('/all', adminOnly, removeAll);
router.delete('/:id', adminOnly, remove);

module.exports = router;
