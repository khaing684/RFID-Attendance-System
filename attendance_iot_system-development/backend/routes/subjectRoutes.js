const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    getSubjectById,
    getSubjectAttendanceStats
} = require('../controllers/subjectController');
const { 
    getStudentSubjectAttendance, 
    getSubjectAttendance 
} = require('../controllers/subjectAttendanceController');

// Public routes
router.route('/')
    .get(protect, getSubjects)
    .post(protect, admin, createSubject);

router.route('/:id')
    .get(protect, getSubjectById)
    .put(protect, admin, updateSubject)
    .delete(protect, admin, deleteSubject);

router.get('/attendance-stats', protect, getSubjectAttendanceStats);

// Attendance routes
router.route('/:subjectId/attendance')
    .get(protect, getSubjectAttendance);

router.route('/:subjectId/attendance/:studentId')
    .get(protect, getStudentSubjectAttendance);

module.exports = router; 