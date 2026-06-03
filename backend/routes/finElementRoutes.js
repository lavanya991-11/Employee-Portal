const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const {
    list, getOne, create, update, remove
} = require('../controllers/finElementController');

router.get('/', protect, list);
router.get('/:id', protect, getOne);
router.post('/', protect, create);
router.put('/:id', protect, update);
router.delete('/:id', protect, remove);

module.exports = router;
