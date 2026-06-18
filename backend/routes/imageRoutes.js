const express = require('express');
const { protect } = require('../middleware/authmiddleware');
const {
    uploadBase64,
    getById,
    getMyLatest,
    listMine,
    deleteById
} = require('../controllers/imageController');

const router = express.Router();

router.post('/upload', protect, uploadBase64);
router.get('/me', protect, getMyLatest);
router.get('/', protect, listMine);
router.get('/:id', getById); // public so <img src> works without an Authorization header
router.delete('/:id', protect, deleteById);

module.exports = router;
