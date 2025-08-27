const express = require('express');
const router = express.Router();
const {
    createClass,
    getClasses,
    getTeacherClasses,
    updateClass,
    deleteClass,
    getClassById
} = require('../controllers/classController');
const { protect, admin, checkRoles } = require('../middleware/authMiddleware');

// Admin only routes for full class management
router.route('/')
    .post(protect, admin, createClass) // Create a new class
    .get(protect, admin, getClasses);   // Get all classes

// Teacher specific routes (MUST be before /:id route)
router.get('/myclasses', protect, checkRoles(['teacher']), getTeacherClasses); // Get classes assigned to the logged-in teacher

router.route('/:id')
    .get(protect, checkRoles(['admin', 'teacher']), getClassById) // Get class by ID (accessible by admin and assigned teacher)
    .put(protect, admin, updateClass)   // Update a class
    .delete(protect, admin, deleteClass); // Delete a class

module.exports = router;