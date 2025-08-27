const Class = require('../models/classModel');
const Schedule = require('../models/scheduleModel');
const Attendance = require('../models/attendanceModel');
const User = require('../models/userModel');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
const getClasses = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view all classes' });
        }

        const classes = await Class.find({})
            .populate('teacher', 'name email')
            .populate('students', 'name studentId rfidId email');
        res.status(200).json(classes);

    } catch (error) {
        console.error('Error getting classes:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get a single class by ID
// @route   GET /api/classes/:id
// @access  Private/Admin or Private/Teacher (if assigned)
const getClassById = async (req, res) => {
    try {
        console.log(`Attempting to fetch class with ID: ${req.params.id}`);
        console.log(`User role: ${req.user ? req.user.role : 'N/A'}, User ID: ${req.user ? req.user._id : 'N/A'}`);

        const classItem = await Class.findById(req.params.id).populate('teacher', 'name email');

        if (!classItem) {
            console.log(`Class with ID ${req.params.id} not found.`);
            return res.status(404).json({ message: 'Class not found' });
        }

        console.log(`Class found: ${classItem.name}, Assigned Teacher: ${classItem.teacher?.name}`);

        // Admin can view any class
        if (req.user.role === 'admin') {
            console.log('User is admin, granting access.');
            return res.json(classItem);
        }

        // Teacher can only view classes they are assigned to
        if (req.user.role === 'teacher') {
            if (classItem.teacher && classItem.teacher._id.toString() === req.user._id.toString()) {
                console.log('User is teacher and assigned to this class, granting access.');
                return res.json(classItem);
            } else {
                console.log('User is teacher but not assigned to this class.');
                return res.status(403).json({ message: 'Not authorized to view this class' });
            }
        }

        // Fallback for other roles or unauthenticated users
        console.log('User role is neither admin nor assigned teacher.');
        res.status(403).json({ message: 'Not authorized to view this class' });

    } catch (error) {
        console.error('Error getting class by ID:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private/Admin
const createClass = async (req, res) => {
    try {
        const { name, teacherId } = req.body;

        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to create classes' });
        }

        if (!name || !teacherId) {
            return res.status(400).json({ message: 'Please enter class name and assign a teacher' });
        }

        const teacher = await User.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        if (teacher.role !== 'teacher') {
            return res.status(400).json({ message: 'Assigned user is not a teacher' });
        }

        const classExists = await Class.findOne({ name });
        if (classExists) {
            return res.status(400).json({ message: 'Class with this name already exists' });
        }

        const newClass = await Class.create({
            name,
            teacher: teacherId
        });

        res.status(201).json({
            message: 'Class created successfully',
            class: newClass
        });

    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private/Admin
const updateClass = async (req, res) => {
    try {
        const { name, teacherId } = req.body;

        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update classes' });
        }

        const classToUpdate = await Class.findById(req.params.id);

        if (!classToUpdate) {
            return res.status(404).json({ message: 'Class not found' });
        }

        if (name) {
            const classExists = await Class.findOne({ name });
            if (classExists && classExists._id.toString() !== req.params.id) {
                return res.status(400).json({ message: 'Class with this name already exists' });
            }
            classToUpdate.name = name;
        }

        if (teacherId) {
            const teacher = await User.findById(teacherId);
            if (!teacher) {
                return res.status(404).json({ message: 'Teacher not found' });
            }
            if (teacher.role !== 'teacher') {
                return res.status(400).json({ message: 'Assigned user is not a teacher' });
            }
            classToUpdate.teacher = teacherId;
        }

        const updatedClass = await classToUpdate.save();

        res.status(200).json({
            message: 'Class updated successfully',
            class: updatedClass
        });

    } catch (error) {
        console.error('Error updating class:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
const deleteClass = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete classes' });
        }

        const classToDelete = await Class.findById(req.params.id);

        if (!classToDelete) {
            return res.status(404).json({ message: 'Class not found' });
        }

        await classToDelete.deleteOne();
        res.status(200).json({ message: 'Class removed' });

    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Bulk delete classes
// @route   DELETE /api/classes/bulk-delete
// @access  Private/Admin
const bulkDeleteClasses = async (req, res) => {
    try {
        const { classIds } = req.body;
        
        if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of class IDs' });
        }

        // Delete all schedules for these classes
        await Schedule.deleteMany({ class: { $in: classIds } });
        
        // Delete all attendance records for these classes
        await Attendance.deleteMany({ class: { $in: classIds } });
        
        // Delete the classes
        const result = await Class.deleteMany({ _id: { $in: classIds } });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No classes found to delete' });
        }

        res.json({
            message: `Successfully deleted ${result.deletedCount} classes and their related records`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get classes assigned to the logged-in teacher
// @route   GET /api/classes/myclasses
// @access  Private/Teacher
const getTeacherClasses = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Not authorized to view teacher classes' });
        }

        const classes = await Class.find({ teacher: req.user._id }).populate('teacher', 'name email');
        res.status(200).json(classes);

    } catch (error) {
        console.error('Error getting teacher classes:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
    bulkDeleteClasses,
    getTeacherClasses
}; 