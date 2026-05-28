const express = require('express');
const router = express.Router();
const protect = require('../middleware/authmiddleware');
const {
    applyAsset,
    getMyAssets,
    getAllAssets,
    updateAssetStatus
} = require('../controllers/assetController');

router.post('/apply', protect, applyAsset);
router.get('/my', protect, getMyAssets);
router.get('/all', protect, getAllAssets);
router.put('/:id/status', protect, updateAssetStatus);

module.exports = router;
