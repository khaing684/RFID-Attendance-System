const express = require('express');
const router = express.Router();
const { getAttendance, getAttendanceById, createAttendance, updateAttendance, deleteAttendance, exportAttendance, getAttendanceBySubject, getStudentAttendanceBySubject, getAttendanceStats, getRecentScans, recordAttendanceScan, getRealtimeScans, getAttendanceByClassForTeacher } = require('../controllers/attendanceController');
const { protect, checkRoles } = require('../middleware/authMiddleware');

// Get real-time scans
router.get('/realtime-scans', protect, getRealtimeScans);

// Get recent scans - must be before /:id route
router.get('/recent-scans', protect, getRecentScans);

// Get attendance statistics
router.get('/stats', protect, getAttendanceStats);

// Export attendance
router.get('/export', protect, checkRoles(['admin', 'teacher']), exportAttendance);

// Get attendance by subject
router.get('/by-subject', protect, getAttendanceBySubject);

// Get student attendance by subject
router.get('/student/:studentId/by-subject', protect, getStudentAttendanceBySubject);

// Record attendance scan
router.post('/scan', protect, checkRoles(['admin', 'teacher']), recordAttendanceScan);

// Teacher specific attendance for a class
router.get('/class/:classId', protect, checkRoles(['teacher']), getAttendanceByClassForTeacher);

// Main attendance routes
router.route('/')
    .get(protect, getAttendance)
    .post(protect, checkRoles(['admin', 'teacher']), createAttendance);

// ID specific routes - must be last
router.route('/:id')
    .get(protect, getAttendanceById)
    .put(protect, checkRoles(['admin', 'teacher']), updateAttendance)
    .delete(protect, checkRoles(['admin']), deleteAttendance);

module.exports = router; 