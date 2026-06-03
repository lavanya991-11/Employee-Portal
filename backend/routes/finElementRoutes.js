const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const {
    list, getOne, create, update, remove, scanFromBc
} = require('../controllers/finElementController');

router.get('/', protect, list);
router.post('/scan-from-bc', protect, scanFromBc);
router.get('/:id', protect, getOne);
router.post('/', protect, create);
router.put('/:id', protect, update);
router.delete('/:id', protect, remove);

module.exports = router;
