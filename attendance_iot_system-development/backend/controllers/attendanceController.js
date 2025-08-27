const Attendance = require('../models/attendanceModel');
const Student = require('../models/studentModel');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const Class = require('../models/classModel');
const Schedule = require('../models/scheduleModel');
const Holiday = require('../models/holidayModel');
const asyncHandler = require('express-async-handler');
const Device = require('../models/deviceModel');

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res) => {
    try {
        const { classId, date, studentId } = req.query;
        let query = {};
        
        if (classId) query.class = classId;
        if (studentId) query.student = studentId;
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            
            query.date = { $gte: startDate, $lte: endDate };
        }
        
        // If user is a teacher, only show their classes
        if (req.user.role === 'teacher') {
            const teacherClasses = await Class.find({ teacher: req.user._id }).select('_id');
            const classIds = teacherClasses.map(c => c._id);
            // If a specific classId is requested by a teacher, ensure it's one of their assigned classes
            if (query.class && !classIds.includes(query.class)) {
                return res.status(403).json({ message: 'Not authorized to view attendance for this class' });
            }
            query.class = { $in: classIds };
        }
        
        const attendance = await Attendance.find(query)
            .populate('student', 'name studentId rfidId')
            .populate('class', 'name')
            .populate({
                path: 'schedule',
                select: 'day startTime endTime room subject',
                populate: {
                    path: 'subject',
                    select: 'name code'
                }
            })
            .populate('rfidDevice', 'name location')
            .sort('-checkinTime');
            
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Server Error' : error.message });
    }
};

// @desc    Get attendance records for a specific class (for assigned teacher)
// @route   GET /api/attendance/class/:classId
// @access  Private/Teacher
const getAttendanceByClassForTeacher = async (req, res) => {
    try {
        const { classId } = req.params;
        const { date } = req.query; // Optional date filter

        if (!req.user || req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Not authorized to view class attendance' });
        }

        // Verify that the teacher is assigned to this class
        const assignedClass = await Class.findOne({ _id: classId, teacher: req.user._id });
        
        if (!assignedClass) {
            return res.status(404).json({ message: 'Class not found or you are not assigned to this class' });
        }

        let query = { class: classId };
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const attendance = await Attendance.find(query)
            .populate('student', 'name studentId rfidId')
            .populate('class', 'name')
            .populate({
                path: 'schedule',
                select: 'day startTime endTime room subject',
                populate: {
                    path: 'subject',
                    select: 'name code'
                }
            })
            .populate('rfidDevice', 'name location')
            .sort('-checkinTime');

        res.json(attendance);

    } catch (error) {
        console.error('Error fetching teacher class attendance:', error);
        res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Server Error' : error.message });
    }
};

// @desc    Get attendance record by ID
// @route   GET /api/attendance/:id
// @access  Private
const getAttendanceById = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id)
            .populate('student', 'name studentId rfidId')
            .populate('class', 'name')
            .populate('schedule', 'day subject startTime endTime')
            .populate('rfidDevice', 'name location');
        
        if (attendance) {
            // Ensure teacher can only view attendance for their assigned classes
            if (req.user.role === 'teacher') {
                const teacherClasses = await Class.find({ teacher: req.user._id }).select('_id');
                if (!teacherClasses.map(c => c._id.toString()).includes(attendance.class.toString())) {
                    return res.status(403).json({ message: 'Not authorized to view this attendance record' });
                }
            }
            res.json(attendance);
        } else {
            res.status(404).json({ message: 'Attendance record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an attendance record
// @route   POST /api/attendance
// @access  Private/Teacher
const createAttendance = async (req, res) => {
    try {
        const { student, class: classId, schedule, date, status, rfidDevice, checkinTime, notes } = req.body;
        
        const attendance = await Attendance.create({
            student,
            class: classId,
            schedule,
            date: date || new Date(),
            status: status || 'present',
            rfidDevice,
            checkinTime: checkinTime || new Date(),
            notes
        });
        
        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an attendance record
// @route   PUT /api/attendance/:id
// @access  Private/Teacher
const updateAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id);
        
        if (attendance) {
            attendance.student = req.body.student || attendance.student;
            attendance.class = req.body.class || attendance.class;
            attendance.schedule = req.body.schedule || attendance.schedule;
            attendance.date = req.body.date || attendance.date;
            attendance.status = req.body.status || attendance.status;
            attendance.rfidDevice = req.body.rfidDevice || attendance.rfidDevice;
            attendance.checkinTime = req.body.checkinTime || attendance.checkinTime;
            attendance.notes = req.body.notes || attendance.notes;
            
            const updatedAttendance = await attendance.save();
            res.json(updatedAttendance);
        } else {
            res.status(404).json({ message: 'Attendance record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an attendance record
// @route   DELETE /api/attendance/:id
// @access  Private/Admin
const deleteAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id);
        
        if (attendance) {
            await attendance.deleteOne();
            res.json({ message: 'Attendance record removed' });
        } else {
            res.status(404).json({ message: 'Attendance record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getDatesForSchedule = (startDate, endDate, dayOfWeek) => {
    // dayOfWeek: 'Monday', 'Tuesday', etc.
    const dayIndex = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(dayOfWeek);
    const dates = [];
    let current = new Date(startDate);
    current.setHours(0,0,0,0);
    const end = new Date(endDate);
    end.setHours(0,0,0,0);
    while (current <= end) {
        if (current.getDay() === dayIndex) {
            dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
    }
    return dates;
};

// @desc    Export attendance records to CSV
// @route   GET /api/attendance/export
// @access  Private/Teacher
const exportAttendance = async (req, res) => {
    try {
        const { classId, startDate, endDate } = req.query;
        if (!classId || !startDate || !endDate) {
            return res.status(400).json({ message: 'Class ID, start date, and end date are required' });
        }
        // Get class info (for teacher/room)
        const classInfo = await Class.findById(classId).populate('teacher', 'name').lean();
        const teacherName = classInfo?.teacher?.name || '';
        const room = classInfo?.room || '';
        // Get all students in the class
        const students = await Student.find({ class: classId }).lean();
        // Get all schedules for the class
        const schedules = await Schedule.find({ class: classId }).populate('subject', 'name').lean();
        // Build a list of all scheduled sessions (date, subject, scheduleId)
        let scheduledSessions = [];
        for (const sched of schedules) {
            const dates = getDatesForSchedule(startDate, endDate, sched.day);
            for (const date of dates) {
                scheduledSessions.push({
                    date: new Date(date),
                    scheduleId: sched._id.toString(),
                    subjectName: sched.subject?.name || 'Unknown Subject',
                    subjectId: sched.subject?._id?.toString() || '',
                    day: sched.day
                });
            }
        }
        // Query attendance records for the class and date range
        const attendanceRecords = await Attendance.find({
            class: classId,
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }).populate('student', 'name studentId')
          .populate('class', 'name')
          .populate({ path: 'schedule', select: 'day startTime endTime subject', populate: { path: 'subject', select: 'name' } });
        // Format data for CSV (as before)
        const formattedData = attendanceRecords.map(record => ({
            'Student Name': record.student.name,
            'Student ID': record.student.studentId,
            'Class': record.class.name,
            'Teacher': teacherName,
            'Room': room,
            'Day': record.schedule.day,
            'Time': `${record.schedule.startTime} - ${record.schedule.endTime}`,
            'Date': record.date.toLocaleDateString(),
            'Status': record.status,
            'Check-in Time': record.checkinTime ? record.checkinTime.toLocaleTimeString() : '',
            'Notes': record.notes || '',
            'Summary': ''
        }));
        // --- Calculate true attendance percentages ---
        // Helper: Map for quick lookup
        const attendanceMap = {};
        attendanceRecords.forEach(rec => {
            const key = `${rec.student._id}_${rec.schedule._id}_${rec.date.toISOString().slice(0,10)}`;
            attendanceMap[key] = rec.status;
        });
        // Subject-wise summary
        const subjectStats = {};
        // Student overall and per subject
        const studentStats = {};
        for (const student of students) {
            let studentTotal = 0, studentAttended = 0;
            const perSubject = {};
            for (const session of scheduledSessions) {
                studentTotal++;
                // Per subject
                if (!perSubject[session.subjectName]) perSubject[session.subjectName] = { total: 0, attended: 0 };
                perSubject[session.subjectName].total++;
                // Subject overall
                if (!subjectStats[session.subjectName]) subjectStats[session.subjectName] = { total: 0, attended: 0 };
                subjectStats[session.subjectName].total++;
                // Check if attended
                const key = `${student._id}_${session.scheduleId}_${session.date.toISOString().slice(0,10)}`;
                const status = attendanceMap[key];
                if (status === 'present' || status === 'late') {
                    studentAttended++;
                    perSubject[session.subjectName].attended++;
                    subjectStats[session.subjectName].attended++;
                }
            }
            studentStats[student.studentId] = {
                name: student.name,
                id: student.studentId,
                total: studentTotal,
                attended: studentAttended,
                perSubject
            };
        }
        // --- Add summary rows ---
        formattedData.push({ 'Summary': '' });
        // Subject-wise summary (overall)
        Object.entries(subjectStats).forEach(([subject, stat]) => {
            formattedData.push({
                'Student Name': '',
                'Student ID': '',
                'Class': '',
                'Teacher': '',
                'Room': '',
                'Day': '',
                'Time': '',
                'Date': '',
                'Status': `Subject: ${subject}`,
                'Check-in Time': '',
                'Notes': `Attended: ${stat.attended}, Total: ${stat.total}, Attendance %: ${(stat.attended / stat.total * 100).toFixed(2)}%`,
                'Summary': 'Subject Summary'
            });
        });
        formattedData.push({ 'Summary': '' });
        // Per-student overall summary
        Object.values(studentStats).forEach(stat => {
            formattedData.push({
                'Student Name': stat.name,
                'Student ID': stat.id,
                'Class': '',
                'Teacher': '',
                'Room': '',
                'Day': '',
                'Time': '',
                'Date': '',
                'Status': 'Overall Attendance',
                'Check-in Time': '',
                'Notes': `Attended: ${stat.attended}, Total: ${stat.total}, Attendance %: ${(stat.attended / stat.total * 100).toFixed(2)}%`,
                'Summary': 'Student Summary'
            });
        });
        // --- End summary rows ---
        // Create CSV
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(formattedData);
        const fileName = `attendance_${classId}_${startDate}_${endDate}.csv`.replace(/[/\\?%*:|"<>]/g, '-');
        const filePath = path.join(__dirname, '../uploads', fileName);
        fs.writeFileSync(filePath, csv);
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error downloading attendance export:', err);
                res.status(500).json({ message: 'Failed to export attendance data' });
            }
        });
    } catch (error) {
        console.error('Error exporting attendance:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get attendance statistics by subject
// @route   GET /api/attendance/by-subject
// @access  Private
const getAttendanceBySubject = async (req, res) => {
    try {
        const { classId, startDate, endDate } = req.query;
        let query = {};
        
        // Add class filter if provided
        if (classId) {
            query.class = classId;
        }
        
        // Add date range filter if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }
        
        // If user is a teacher, only show their classes
        if (req.user.role === 'teacher') {
            const teacherClasses = await Class.find({ teacher: req.user._id }).select('_id');
            const classIds = teacherClasses.map(c => c._id);
            query.class = { $in: classIds };
        }
        
        // Get all attendance records that match the query
        const attendanceRecords = await Attendance.find(query)
            .populate({
                path: 'schedule',
                select: 'subject day startTime endTime'
            })
            .populate('student', 'name studentId')
            .populate('class', 'name');
        
        // Group by subject and calculate statistics
        const subjectStats = {};
        
        attendanceRecords.forEach(record => {
            if (!record.schedule || !record.schedule.subject) return;
            
            const subjectName = record.schedule.subject.name;
            
            if (!subjectStats[subjectName]) {
                subjectStats[subjectName] = {
                    subject: subjectName,
                    totalSessions: 0,
                    present: 0,
                    late: 0,
                    absent: 0,
                    percentage: 0
                };
            }
            
            subjectStats[subjectName].totalSessions++;
            
            if (record.status === 'present') {
                subjectStats[subjectName].present++;
            } else if (record.status === 'late') {
                subjectStats[subjectName].late++;
            } else if (record.status === 'absent') {
                subjectStats[subjectName].absent++;
            }
        });
        
        // Calculate percentages
        Object.keys(subjectStats).forEach(subjectName => {
            const stats = subjectStats[subjectName];
            const totalAttended = stats.present + stats.late;
            stats.percentage = (totalAttended / stats.totalSessions) * 100;
        });
        
        // Convert to array and sort by subject name
        const result = Object.values(subjectStats).sort((a, b) => 
            a.subject.localeCompare(b.subject)
        );
        
        res.json({
            total: result.length,
            subjectStats: result
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get attendance statistics by subject for a specific student
// @route   GET /api/attendance/student/:studentId/by-subject
// @access  Private
const getStudentAttendanceBySubject = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate } = req.query;
        
        // Verify student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        let query = { student: studentId };
        
        // Add date range filter if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }
        
        // Get all attendance records for this student
        const attendanceRecords = await Attendance.find(query)
            .populate({
                path: 'schedule',
                select: 'subject day startTime endTime'
            })
            .populate('class', 'name');
        
        // Group by subject and calculate statistics
        const subjectStats = {};
        
        attendanceRecords.forEach(record => {
            if (!record.schedule || !record.schedule.subject) return;
            
            const subjectName = record.schedule.subject.name;
            
            if (!subjectStats[subjectName]) {
                subjectStats[subjectName] = {
                    subject: subjectName,
                    totalSessions: 0,
                    present: 0,
                    late: 0,
                    absent: 0,
                    percentage: 0
                };
            }
            
            subjectStats[subjectName].totalSessions++;
            
            if (record.status === 'present') {
                subjectStats[subjectName].present++;
            } else if (record.status === 'late') {
                subjectStats[subjectName].late++;
            } else if (record.status === 'absent') {
                subjectStats[subjectName].absent++;
            }
        });
        
        // Calculate percentages
        Object.keys(subjectStats).forEach(subjectName => {
            const stats = subjectStats[subjectName];
            const totalAttended = stats.present + stats.late;
            stats.percentage = (totalAttended / stats.totalSessions) * 100;
        });
        
        // Convert to array and sort by subject name
        const result = Object.values(subjectStats).sort((a, b) => 
            a.subject.localeCompare(b.subject)
        );
        
        res.json({
            student: {
                id: student._id,
                name: student.name,
                studentId: student.studentId
            },
            total: result.length,
            subjectStats: result
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student attendance statistics by class for the last month
// @route   GET /api/attendance/stats
// @access  Private
const getAttendanceStats = async (req, res) => {
  try {
    const { studentId, classId } = req.query;

    // Calculate date range for the last month
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Find all schedules for the class
    const schedules = await Schedule.find({
      class: classId,
      active: true
    });

    // Calculate total number of classes in the last month
    const totalClasses = schedules.length * 4; // Assuming 4 weeks in a month

    // Get attendance records for the student
    const attendanceRecords = await Attendance.find({
      student: studentId,
      class: classId,
      date: { $gte: startDate, $lte: endDate }
    }).populate('schedule');

    // Calculate statistics
    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    const lateCount = attendanceRecords.filter(record => record.status === 'late').length;
    const totalPresent = presentCount + lateCount;
    const attendancePercentage = (totalPresent / totalClasses) * 100;

    // Group by subject/schedule
    const subjectStats = {};
    schedules.forEach(schedule => {
      const subjectRecords = attendanceRecords.filter(
        record => record.schedule._id.toString() === schedule._id.toString()
      );
      
      const subjectPresent = subjectRecords.filter(record => 
        record.status === 'present' || record.status === 'late'
      ).length;
      
      subjectStats[schedule.subject || 'Unnamed Subject'] = {
        total: 4, // 4 classes per month for this schedule
        present: subjectPresent,
        percentage: (subjectPresent / 4) * 100
      };
    });

    res.json({
      period: {
        start: startDate,
        end: endDate
      },
      overall: {
        totalClasses,
        present: totalPresent,
        late: lateCount,
        percentage: attendancePercentage.toFixed(2)
      },
      subjectWise: subjectStats
    });

  } catch (error) {
    console.error('Error getting attendance stats:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record attendance via RFID scan
// @route   POST /api/attendance/scan
// @access  Public
const recordAttendanceScan = asyncHandler(async (req, res) => {
  const { rfidId, deviceId } = req.body;

  // Validate input
  if (!rfidId || !deviceId) {
    res.status(400);
    throw new Error('RFID ID and device ID are required');
  }

  console.log('Processing RFID scan:', { rfidId, deviceId });

  // Find student by RFID ID
  const student = await Student.findOne({ rfidId }).populate('class');
  if (!student) {
    console.log('Student not found for RFID:', rfidId);
    res.status(404);
    throw new Error('Student not found');
  }

  console.log('Found student:', { 
    name: student.name, 
    studentId: student.studentId,
    class: student.class?.name 
  });

  // Find device
  const device = await Device.findById(deviceId);
  if (!device) {
    console.log('Device not found:', deviceId);
    res.status(404);
    throw new Error('Device not found');
  }

  console.log('Found device:', { 
    name: device.name, 
    location: device.location,
    assignedClass: device.assignedClass 
  });

  // Validate device assignment
  if (device.assignedClass && device.assignedClass.toString() !== student.class._id.toString()) {
    console.log('Device class mismatch:', {
      deviceClass: device.assignedClass,
      studentClass: student.class._id
    });
    res.status(403);
    throw new Error('Invalid device for this student\'s class');
  }

  // Get current time and day
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = days[now.getDay()];
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false });

  console.log('Current time:', { currentDay, currentTime });

  // Find current schedule
  const schedule = await Schedule.findOne({
    class: student.class._id,
    day: currentDay,
    startTime: { $lte: currentTime },
    endTime: { $gte: currentTime }
  });

  if (!schedule) {
    console.log('No active schedule found for:', {
      class: student.class._id,
      day: currentDay,
      time: currentTime
    });
    res.status(400);
    throw new Error('No active class schedule found');
  }

  console.log('Found schedule:', {
    subject: schedule.subject,
    startTime: schedule.startTime,
    endTime: schedule.endTime
  });

  // Check if attendance already recorded
  const existingAttendance = await Attendance.findOne({
    student: student._id,
    schedule: schedule._id,
    date: {
      $gte: new Date(now.setHours(0, 0, 0, 0)),
      $lt: new Date(now.setHours(23, 59, 59, 999))
    }
  });

  if (existingAttendance) {
    console.log('Attendance already recorded:', existingAttendance._id);
    res.status(400);
    throw new Error('Attendance already recorded for this class');
  }

  // Calculate time difference from class start
  const [scheduleHours, scheduleMinutes] = schedule.startTime.split(':').map(Number);
  const scheduleStartTime = new Date(now);
  scheduleStartTime.setHours(scheduleHours, scheduleMinutes, 0);

  const timeDifference = Math.floor((now - scheduleStartTime) / (1000 * 60)); // difference in minutes

  // Determine attendance status
  let status = 'present';
  if (timeDifference > 15) { // More than 15 minutes late
    status = 'late';
  }

  console.log('Recording attendance:', {
    student: student._id,
    class: student.class._id,
    schedule: schedule._id,
    status,
    timeDifference
  });

  // Record attendance
  const attendance = await Attendance.create({
    student: student._id,
    class: student.class._id,
    schedule: schedule._id,
    date: now,
    status,
    rfidDevice: device._id,
    checkinTime: now,
    notes: device.assignedClass ? '' : 'Attendance recorded from unassigned device'
  });

  console.log('Attendance recorded successfully:', attendance._id);

  res.status(201).json({
    message: `Attendance recorded as ${status}`,
    attendance,
    device: {
      name: device.name,
      location: device.location,
      isAssigned: !!device.assignedClass
    }
  });
});

// @desc    Get recent attendance scans
// @route   GET /api/attendance/recent-scans
// @access  Private
const getRecentScans = asyncHandler(async (req, res) => {
    try {
        const recentScans = await Attendance.find()
            .populate('student', 'name studentId rfidId')
            .populate('class', 'name')
            .populate({
                path: 'schedule',
                select: 'day startTime endTime room subject',
                populate: {
                    path: 'subject',
                    select: 'name code'
                }
            })
            .populate('rfidDevice', 'name location')
            .sort('-checkinTime')
            .limit(10); // Get last 10 records
            
        res.json(recentScans);
    } catch (error) {
        console.error('Error fetching recent scans:', error);
        res.status(500).json({ message: 'Error fetching recent scans' });
    }
});

// @desc    Get real-time RFID scan data
// @route   GET /api/attendance/realtime-scans
// @access  Private
const getRealtimeScans = async (req, res) => {
    try {
        // Get the last 10 scans from the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const scans = await Attendance.find({
            checkinTime: { $gte: fiveMinutesAgo }
        })
        .populate('student', 'name studentId rfidId')
        .populate('class', 'name')
        .populate({
            path: 'schedule',
            select: 'day startTime endTime room subject',
            populate: {
                path: 'subject',
                select: 'name code'
            }
        })
        .populate('rfidDevice', 'name location')
        .sort('-checkinTime')
        .limit(10);
        
        res.json(scans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAttendance,
    getAttendanceById,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    exportAttendance,
    getAttendanceBySubject,
    getStudentAttendanceBySubject,
    getAttendanceStats,
    getRecentScans,
    recordAttendanceScan,
    getRealtimeScans,
    getAttendanceByClassForTeacher,
}; 