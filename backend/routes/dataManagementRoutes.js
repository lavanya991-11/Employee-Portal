const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { listTables, deleteOne, deleteSelected, deleteAll } = require('../controllers/dataManagementController');

router.get('/tables', protect, listTables);
router.delete('/tables/:key', protect, deleteOne);
router.post('/delete-selected', protect, deleteSelected);
router.delete('/all', protect, deleteAll);

module.exports = router;
