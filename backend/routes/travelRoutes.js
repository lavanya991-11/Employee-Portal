const express = require('express');
const router = express.Router();
const protect = require('../middleware/authmiddleware');
const {
    applyTravel,
    getMyTravels,
    getAllTravels,
    updateTravelStatus
} = require('../controllers/travelController');

router.post('/apply', protect, applyTravel);
router.get('/my', protect, getMyTravels);
router.get('/all', protect, getAllTravels);
router.put('/:id/status', protect, updateTravelStatus);

module.exports = router;
