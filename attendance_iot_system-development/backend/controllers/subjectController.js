const Subject = require('../models/subjectModel');
const Class = require('../models/classModel');
const asyncHandler = require('express-async-handler');
const Schedule = require('../models/scheduleModel');
const Attendance = require('../models/attendanceModel');

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = asyncHandler(async (req, res) => {
    const { name, code, description, classes, weeklyHours, totalHours, semester, year } = req.body;

    // Check if subject with same code exists
    const subjectExists = await Subject.findOne({ code });
    if (subjectExists) {
        res.status(400);
        throw new Error('Subject with this code already exists');
    }

    // Validate classes if provided
    if (classes && classes.length > 0) {
        const validClasses = await Class.find({ _id: { $in: classes } });
        if (validClasses.length !== classes.length) {
            res.status(400);
            throw new Error('One or more invalid class IDs provided');
        }
    }

    const subject = await Subject.create({
        name,
        code,
        description,
        classes: classes || [],
        weeklyHours: weeklyHours || 0,
        totalHours: totalHours || 0,
        semester,
        year
    });

    if (subject) {
        const populatedSubject = await Subject.findById(subject._id)
            .populate('classes', 'name');
        res.status(201).json(populatedSubject);
    } else {
        res.status(400);
        throw new Error('Invalid subject data');
    }
});

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getSubjects = asyncHandler(async (req, res) => {
    const subjects = await Subject.find({})
        .populate('classes', 'name')
        .sort({ code: 1 });
    res.json(subjects);
});

// @desc    Get subject by ID
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id)
        .populate('classes', 'name');
    
    if (subject) {
        res.json(subject);
    } else {
        res.status(404);
        throw new Error('Subject not found');
    }
});

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    // Check if updating code and if it already exists
    if (req.body.code && req.body.code !== subject.code) {
        const codeExists = await Subject.findOne({ code: req.body.code });
        if (codeExists) {
            res.status(400);
            throw new Error('Subject with this code already exists');
        }
    }

    // Validate classes if provided
    if (req.body.classes && req.body.classes.length > 0) {
        const validClasses = await Class.find({ _id: { $in: req.body.classes } });
        if (validClasses.length !== req.body.classes.length) {
            res.status(400);
            throw new Error('One or more invalid class IDs provided');
        }
    }

    subject.name = req.body.name || subject.name;
    subject.code = req.body.code || subject.code;
    subject.description = req.body.description || subject.description;
    subject.classes = req.body.classes || subject.classes;
    subject.weeklyHours = req.body.weeklyHours || subject.weeklyHours;
    subject.totalHours = req.body.totalHours || subject.totalHours;
    subject.semester = req.body.semester || subject.semester;
    subject.year = req.body.year || subject.year;

    const updatedSubject = await subject.save();
    const populatedSubject = await Subject.findById(updatedSubject._id)
        .populate('classes', 'name');
    
    res.json(populatedSubject);
});

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (subject) {
        await subject.deleteOne();
        res.json({ message: 'Subject removed' });
    } else {
        res.status(404);
        throw new Error('Subject not found');
    }
});

// @desc    Get subject attendance statistics
// @route   GET /api/subjects/attendance-stats
// @access  Private
const getSubjectAttendanceStats = asyncHandler(async (req, res) => {
    const { startDate, endDate, classId } = req.query;

    // Build date query
    let dateQuery = {};
    if (startDate || endDate) {
        dateQuery.date = {};
        if (startDate) dateQuery.date.$gte = new Date(startDate);
        if (endDate) dateQuery.date.$lte = new Date(endDate);
    }

    // Get all subjects
    const subjects = await Subject.find({});
    const stats = [];

    for (const subject of subjects) {
        // Get all schedules for this subject
        const schedules = await Schedule.find({ 
            subject: subject._id,
            ...(classId && { class: classId })
        });
        const scheduleIds = schedules.map(s => s._id);

        // Get attendance records for this subject's schedules
        const attendanceRecords = await Attendance.find({
            schedule: { $in: scheduleIds },
            ...dateQuery
        });

        // Calculate statistics
        const totalSessions = schedules.length;
        const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
        const lateCount = attendanceRecords.filter(record => record.status === 'late').length;
        const absentCount = totalSessions - (presentCount + lateCount);
        const attendancePercentage = totalSessions > 0 ? 
            ((presentCount + lateCount) / totalSessions) * 100 : 0;

        stats.push({
            subject: {
                id: subject._id,
                name: subject.name,
                code: subject.code
            },
            attendance: {
                totalSessions,
                presentCount,
                lateCount,
                absentCount,
                percentage: Math.round(attendancePercentage * 10) / 10
            }
        });
    }

    res.json({
        totalSubjects: stats.length,
        stats: stats.sort((a, b) => b.attendance.percentage - a.attendance.percentage)
    });
});

module.exports = {
    createSubject,
    getSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject,
    getSubjectAttendanceStats
}; 