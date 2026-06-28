const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const {
    getMyInfo,
    saveMyInfo,
    getAllInfo
} = require('../controllers/employeeInfoController');

router.get('/my', protect, getMyInfo);
router.post('/my', protect, saveMyInfo);
router.put('/my', protect, saveMyInfo);
router.get('/all', protect, getAllInfo);

module.exports = router;
