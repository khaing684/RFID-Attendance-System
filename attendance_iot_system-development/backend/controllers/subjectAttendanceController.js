const Subject = require('../models/subjectModel');
const Student = require('../models/studentModel');
const Attendance = require('../models/attendanceModel');
const Schedule = require('../models/scheduleModel');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({}).populate('classes', 'name');
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get subject attendance for a specific student
// @route   GET /api/subjects/:subjectId/attendance/:studentId
// @access  Private
const getStudentSubjectAttendance = async (req, res) => {
    try {
        const { subjectId, studentId } = req.params;

        // Verify subject exists
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Verify student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Get all schedules for this subject
        const schedules = await Schedule.find({ subject: subjectId });
        const scheduleIds = schedules.map(schedule => schedule._id);

        // Get attendance records for this student in this subject
        const attendanceRecords = await Attendance.find({
            student: studentId,
            schedule: { $in: scheduleIds }
        }).populate('schedule');

        // Calculate statistics
        const totalClasses = subject.totalHours;
        const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
        const lateCount = attendanceRecords.filter(record => record.status === 'late').length;
        const absentCount = totalClasses - (presentCount + lateCount);
        const attendancePercentage = ((presentCount + lateCount) / totalClasses) * 100;

        res.json({
            student: {
                name: student.name,
                studentId: student.studentId
            },
            subject: {
                name: subject.name,
                code: subject.code
            },
            attendance: {
                totalClasses,
                presentCount,
                lateCount,
                absentCount,
                percentage: Math.round(attendancePercentage * 10) / 10
            },
            records: attendanceRecords
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all students' attendance for a subject
// @route   GET /api/subjects/:subjectId/attendance
// @access  Private
const getSubjectAttendance = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { classId } = req.query;

        // Verify subject exists
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Get all schedules for this subject
        const schedules = await Schedule.find({ 
            subject: subjectId,
            ...(classId && { class: classId })
        });
        const scheduleIds = schedules.map(schedule => schedule._id);

        // Get all students in the class if classId is provided
        let students;
        if (classId) {
            students = await Student.find({ class: classId });
        } else {
            // Get all students from all classes that have this subject
            const classes = subject.classes;
            students = await Student.find({ class: { $in: classes } });
        }

        // Get attendance for all students
        const attendanceData = await Promise.all(students.map(async (student) => {
            const records = await Attendance.find({
                student: student._id,
                schedule: { $in: scheduleIds }
            });

            const presentCount = records.filter(record => record.status === 'present').length;
            const lateCount = records.filter(record => record.status === 'late').length;
            const absentCount = subject.totalHours - (presentCount + lateCount);
            const percentage = ((presentCount + lateCount) / subject.totalHours) * 100;

            return {
                student: {
                    _id: student._id,
                    name: student.name,
                    studentId: student.studentId
                },
                attendance: {
                    totalClasses: subject.totalHours,
                    presentCount,
                    lateCount,
                    absentCount,
                    percentage: Math.round(percentage * 10) / 10
                }
            };
        }));

        res.json({
            subject: {
                name: subject.name,
                code: subject.code,
                totalHours: subject.totalHours
            },
            attendanceData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get subject attendance statistics
// @route   GET /api/subjects/attendance-stats
// @access  Private
const getSubjectAttendanceStats = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSubjects,
    getStudentSubjectAttendance,
    getSubjectAttendance,
    getSubjectAttendanceStats
}; 