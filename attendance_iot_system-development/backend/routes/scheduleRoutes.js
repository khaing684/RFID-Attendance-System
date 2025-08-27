const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    getSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedulesByClass,
    getCurrentSchedules,
    bulkCreateSchedules,
    deleteClassSchedules,
    bulkDeleteSchedules,
    uploadSchedulesCSV
} = require('../controllers/scheduleController');

// Base routes
router.route('/')
    .get(protect, getSchedules)
    .post(protect, admin, createSchedule);

// Bulk operations
router.route('/bulk')
    .post(protect, admin, bulkCreateSchedules);
router.route('/bulk-delete')
    .delete(protect, admin, bulkDeleteSchedules);

// Class specific routes
router.route('/class/:classId')
    .get(protect, getSchedulesByClass)
    .delete(protect, admin, deleteClassSchedules);

// Current schedules
router.route('/current')
    .get(protect, getCurrentSchedules);

// CSV upload
router.route('/upload-csv')
    .post(protect, admin, upload, uploadSchedulesCSV);

// Individual schedule operations
router.route('/:id')
    .get(protect, getScheduleById)
    .put(protect, admin, updateSchedule)
    .delete(protect, admin, deleteSchedule);

module.exports = router; 