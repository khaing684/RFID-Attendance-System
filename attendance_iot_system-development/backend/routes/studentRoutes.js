const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent, importStudents, bulkDeleteStudents, bulkCreateStudents, assignStudentToClass } = require('../controllers/studentController');
const { protect, checkRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Too many files. Only one file is allowed.' });
        }
        return res.status(400).json({ message: err.message });
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
};

// Routes with role-based access
router.route('/')
    .get(protect, getStudents)
    .post(protect, checkRoles(['admin', 'teacher']), createStudent);

router.route('/import')
    .post(protect, checkRoles(['admin']), upload, importStudents);

router.route('/bulk-delete')
    .delete(protect, checkRoles(['admin']), bulkDeleteStudents);

// Add the /me route BEFORE the /:id route
router.route('/me')
    .get(protect, getStudentById);

router.route('/:id')
    .get(protect, getStudentById)
    .put(protect, checkRoles(['admin', 'teacher']), updateStudent)
    .delete(protect, checkRoles(['admin']), deleteStudent);

// Assign student to class
router.route('/:id/assign-class')
    .put(protect, checkRoles(['admin', 'teacher']), assignStudentToClass);

module.exports = router; 