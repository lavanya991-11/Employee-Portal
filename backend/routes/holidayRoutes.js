const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { list, create, getOne, update, remove } = require('../controllers/holidayController');

router.get('/', protect, list);
router.post('/', protect, create);
router.get('/:id', protect, getOne);
router.put('/:id', protect, update);
router.delete('/:id', protect, remove);

module.exports = router;
