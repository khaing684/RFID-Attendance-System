const express = require('express');
const router = express.Router();
const { 
    createHoliday, 
    bulkCreateHolidays, 
    getHolidays, 
    getHolidayById, 
    updateHoliday, 
    deleteHoliday,
    checkIfHoliday
} = require('../controllers/holidayController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes - none

// Protected routes
router.route('/')
    .get(protect, getHolidays)
    .post(protect, admin, createHoliday);

router.route('/bulk')
    .post(protect, admin, bulkCreateHolidays);

router.route('/check/:date')
    .get(protect, checkIfHoliday);

router.route('/:id')
    .get(protect, getHolidayById)
    .put(protect, admin, updateHoliday)
    .delete(protect, admin, deleteHoliday);

module.exports = router; 