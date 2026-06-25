const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const {
    earningPayCodes,
    submit,
    listMine,
    listAll
} = require('../controllers/travelRequestController');

router.get('/earning-paycodes', protect, earningPayCodes);
router.get('/my', protect, listMine);
router.get('/all', protect, listAll);
router.post('/', protect, submit);

module.exports = router;
