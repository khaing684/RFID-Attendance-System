const Schedule = require('../models/scheduleModel');
const Class = require('../models/classModel');
const Subject = require('../models/subjectModel');
const Holiday = require('../models/holidayModel');
const Attendance = require('../models/attendanceModel');
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const mongoose = require('mongoose');

// @desc    Get all schedules
// @route   GET /api/schedules
// @access  Private
const getSchedules = async (req, res) => {
    try {
        const { day, active, class: classId } = req.query;
        let query = {};
        
        if (day) query.day = day;
        if (active !== undefined) query.active = active === 'true';
        if (classId) query.class = classId;
        
        // If user is a teacher, only show schedules for their classes
        if (req.user.role === 'teacher') {
            const teacherClasses = await Class.find({ teacher: req.user._id }).select('_id');
            const classIds = teacherClasses.map(c => c._id);
            query.class = { $in: classIds };
        }
        
        const schedules = await Schedule.find(query)
            .populate('class', 'name teacher')
            .populate('subject', 'name code')
            .sort({ day: 1, startTime: 1 });
            
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get schedule by ID
// @route   GET /api/schedules/:id
// @access  Private
const getScheduleById = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id)
            .populate('class', 'name teacher');
        
        if (schedule) {
            // If user is teacher, check if they're teaching this class
            if (req.user.role === 'teacher' && 
                schedule.class.teacher.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to access this schedule' });
            }
            
            res.json(schedule);
        } else {
            res.status(404).json({ message: 'Schedule not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a schedule
// @route   POST /api/schedules
// @access  Private/Admin
const createSchedule = async (req, res) => {
    try {
        const { class: classId, day, startTime, endTime, room, subject, active } = req.body;
        
        // Check if class exists
        const classExists = await Class.findById(classId);
        if (!classExists) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Handle subject validation - support both ID and name
        let subjectId = subject;
        if (subject && typeof subject === 'string' && !subject.match(/^[0-9a-fA-F]{24}$/)) {
            // If subject is a string and not an ObjectId, try to find by name
            const subjectDoc = await Subject.findOne({ name: subject });
            if (!subjectDoc) {
                return res.status(404).json({ 
                    message: `Subject "${subject}" not found. Please create the subject first or use a valid subject ID.`
                });
            }
            subjectId = subjectDoc._id;
        } else if (subject) {
            // If subject is provided as ID, verify it exists
            const subjectExists = await Subject.findById(subject);
            if (!subjectExists) {
                return res.status(404).json({ message: 'Subject not found' });
            }
        }
        
        const schedule = await Schedule.create({
            class: classId,
            day,
            startTime,
            endTime,
            room,
            subject: subjectId,
            active: active !== undefined ? active : true
        });
        
        const populatedSchedule = await Schedule.findById(schedule._id)
            .populate('class', 'name')
            .populate('subject', 'name code');
        
        res.status(201).json(populatedSchedule);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                message: 'Invalid ID format for class or subject' 
            });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk create schedules for a class
// @route   POST /api/schedules/bulk
// @access  Private/Admin
const bulkCreateSchedules = async (req, res) => {
    try {
        const { class: classId, schedules } = req.body;
        
        // Validate request
        if (!classId || !schedules || !Array.isArray(schedules) || schedules.length === 0) {
            return res.status(400).json({ 
                message: 'Please provide a valid class ID and schedules array' 
            });
        }
        
        // Check if class exists
        const classExists = await Class.findById(classId);
        if (!classExists) {
            return res.status(404).json({ message: 'Class not found' });
        }
        
        // Format the schedules for insertion
        const schedulesToInsert = [];
        const errors = [];
        
        for (const daySchedule of schedules) {
            const { day, periods } = daySchedule;
            
            if (!day || !periods || !Array.isArray(periods)) {
                continue;
            }
            
            for (const period of periods) {
                // Validate subject ID if provided
                if (period.subject) {
                    try {
                        const subjectExists = await Subject.findById(period.subject);
                        if (!subjectExists) {
                            errors.push(`Subject with ID ${period.subject} not found`);
                            continue;
                        }
                    } catch (error) {
                        if (error.name === 'CastError') {
                            errors.push(`Invalid subject ID format: ${period.subject}`);
                            continue;
                        }
                    }
                }

                schedulesToInsert.push({
                    class: classId,
                    day,
                    startTime: period.startTime,
                    endTime: period.endTime,
                    room: period.room,
                    subject: period.subject,
                    active: true
                });
            }
        }
        
        if (schedulesToInsert.length === 0) {
            return res.status(400).json({ 
                message: 'No valid schedules provided for insertion',
                errors: errors.length > 0 ? errors : undefined
            });
        }
        
        // Insert all schedules
        const createdSchedules = await Schedule.insertMany(schedulesToInsert);
        
        res.status(201).json({
            message: `Successfully created ${createdSchedules.length} schedules`,
            schedules: createdSchedules,
            warnings: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                message: 'Invalid ID format for class or subject' 
            });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get schedules by class ID
// @route   GET /api/schedules/class/:classId
// @access  Private
const getSchedulesByClass = async (req, res) => {
    try {
        const { classId } = req.params;

        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        // If user is a teacher, verify they are assigned to this class
        if (req.user.role === 'teacher') {
            const assignedClass = await Class.findOne({ _id: classId, teacher: req.user._id });
            if (!assignedClass) {
                return res.status(403).json({ message: 'Not authorized to view schedules for this class' });
            }
        }
        // If user is admin, they can view any class schedule, no additional check needed here.

        const schedules = await Schedule.find({ class: classId })
            .populate('class', 'name')
            .populate('subject', 'name code')
            .sort({ day: 1, startTime: 1 });

        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules by class:', error);
        res.status(500).json({ message: error.env.NODE_ENV === 'production' ? 'Server Error' : error.message });
    }
};

// @desc    Update a schedule
// @route   PUT /api/schedules/:id
// @access  Private/Admin
const updateSchedule = async (req, res) => {
    try {
        const { class: classId, day, startTime, endTime, room, subject, active } = req.body;
        
        const schedule = await Schedule.findById(req.params.id);
        
        if (schedule) {
            // If updating class, check if it exists
            if (classId) {
                const classExists = await Class.findById(classId);
                if (!classExists) {
                    return res.status(404).json({ message: 'Class not found' });
                }
                schedule.class = classId;
            }
            
            schedule.day = day || schedule.day;
            schedule.startTime = startTime || schedule.startTime;
            schedule.endTime = endTime || schedule.endTime;
            schedule.room = room || schedule.room;
            schedule.subject = subject || schedule.subject;
            schedule.active = active !== undefined ? active : schedule.active;
            
            const updatedSchedule = await schedule.save();
            
            res.json(updatedSchedule);
        } else {
            res.status(404).json({ message: 'Schedule not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a schedule
// @route   DELETE /api/schedules/:id
// @access  Private/Admin
const deleteSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        
        if (schedule) {
            await schedule.deleteOne();
            res.json({ message: 'Schedule removed' });
        } else {
            res.status(404).json({ message: 'Schedule not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete all schedules for a class
// @route   DELETE /api/schedules/class/:classId
// @access  Private/Admin
const deleteClassSchedules = async (req, res) => {
    try {
        const { classId } = req.params;
        
        // Check if class exists
        const classExists = await Class.findById(classId);
        if (!classExists) {
            return res.status(404).json({ message: 'Class not found' });
        }
        
        const result = await Schedule.deleteMany({ class: classId });
        
        res.json({ 
            message: `${result.deletedCount} schedules removed for class`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active schedules for current day and time
// @route   GET /api/schedules/current
// @access  Private
const getCurrentSchedules = async (req, res) => {
    try {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        
        // Format current time as HH:MM
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;
        
        // Check if today is a holiday
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        const holiday = await Holiday.findOne({
            date: { $gte: today, $lte: endOfDay },
            active: true
        });
        
        if (holiday) {
            return res.json({ 
                isHoliday: true, 
                holiday,
                message: 'Today is a holiday, no active schedules',
                schedules: []
            });
        }
        
        // Find active schedules for current day and time
        const schedules = await Schedule.find({
            day: currentDay,
            active: true,
            startTime: { $lte: currentTime },
            endTime: { $gte: currentTime }
        }).populate('class', 'name teacher');
        
        res.json({
            isHoliday: false,
            currentDay,
            currentTime,
            schedules
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk delete schedules
// @route   DELETE /api/schedules/bulk-delete
// @access  Private/Admin
const bulkDeleteSchedules = async (req, res) => {
    try {
        const { scheduleIds } = req.body;
        
        if (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of schedule IDs' });
        }

        // Delete all attendance records for these schedules
        await Attendance.deleteMany({ schedule: { $in: scheduleIds } });
        
        // Delete the schedules
        const result = await Schedule.deleteMany({ _id: { $in: scheduleIds } });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No schedules found to delete' });
        }

        res.json({
            message: `Successfully deleted ${result.deletedCount} schedules and their related records`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload schedules via CSV
// @route   POST /api/schedules/upload-csv
// @access  Private/Admin
const uploadSchedulesCSV = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const classId = req.body.classId;
  if (!classId) {
    res.status(400);
    throw new Error('Class ID is required');
  }

  // Verify class exists
  const classExists = await Class.findById(classId);
  if (!classExists) {
    res.status(404);
    throw new Error('Class not found');
  }

  const errors = [];

  // Read the CSV file
  const csvData = fs.readFileSync(req.file.path, 'utf8');
  const rows = csvData.split('\n');
  
  // Remove header row and empty rows
  const dataRows = rows.slice(1).filter(row => row.trim());
  
  // First pass: collect all unique subject codes
  const subjectCodes = new Set();
  for (const row of dataRows) {
    const [subjectCode] = row.split(',').map(field => field.trim());
    if (subjectCode) {
      subjectCodes.add(subjectCode);
    }
  }

  console.log('Processing CSV upload:');
  console.log('- Subject codes from CSV:', Array.from(subjectCodes));
  
  // Look up all subjects at once
  const subjects = await Subject.find({
    code: { $in: Array.from(subjectCodes) }
  });

  console.log('- Found subjects:', subjects.map(s => ({
    code: s.code,
    id: s._id.toString()
  })));

  if (subjects.length === 0) {
    res.status(400);
    throw new Error('No matching subjects found in the database');
  }

  // Create a map of subject codes to subject IDs
  const subjectMap = new Map();
  for (const subject of subjects) {
    subjectMap.set(subject.code, subject._id.toString());
  }
  
  // Second pass: create schedules
  const schedulesToCreate = [];
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i].split(',').map(field => field.trim());
    
    if (row.length !== 5) {
      errors.push(`Row ${i + 2}: Invalid number of columns`);
      continue;
    }

    const [subjectCode, day, startTime, endTime, room] = row;

    // Get subject ID from map
    const subjectId = subjectMap.get(subjectCode);
    if (!subjectId) {
      errors.push(`Row ${i + 2}: Subject code "${subjectCode}" not found. Available codes are: ${Array.from(subjectMap.keys()).join(', ')}`);
      continue;
    }

    // Validate day
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    if (!validDays.includes(day)) {
      errors.push(`Row ${i + 2}: Invalid day ${day}`);
      continue;
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      errors.push(`Row ${i + 2}: Invalid time format`);
      continue;
    }

    // Validate time range
    if (startTime >= endTime) {
      errors.push(`Row ${i + 2}: End time must be after start time`);
      continue;
    }

    try {
      // Create schedule document
      const schedule = {
        class: classId,
        subject: subjectId,
        day,
        startTime,
        endTime,
        room,
        active: true
      };

      console.log('Creating schedule:', {
        ...schedule,
        class: schedule.class.toString(),
        subject: schedule.subject
      });

      schedulesToCreate.push(schedule);
    } catch (err) {
      errors.push(`Row ${i + 2}: Error creating schedule: ${err.message}`);
      continue;
    }
  }

  if (errors.length > 0) {
    res.status(400);
    throw new Error('Validation errors:\n' + errors.join('\n'));
  }

  if (schedulesToCreate.length === 0) {
    res.status(400);
    throw new Error('No valid schedules found in the CSV file');
  }

  try {
    // Create all schedules
    const createdSchedules = await Schedule.create(schedulesToCreate);

    // Populate the response with subject details
    const populatedSchedules = await Schedule.find({
      _id: { $in: createdSchedules.map(s => s._id) }
    }).populate('subject', 'name code');

    // Remove temporary file
    try {
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.error('Error removing temporary file:', error);
    }

    res.status(201).json({
      message: `Successfully created ${createdSchedules.length} schedules`,
      schedules: populatedSchedules
    });
  } catch (err) {
    // Clean up the temporary file in case of error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error removing temporary file:', unlinkError);
      }
    }
    console.error('Error creating schedules:', {
      error: err.message,
      schedules: schedulesToCreate.map(s => ({
        ...s,
        class: s.class.toString(),
        subject: s.subject
      }))
    });
    res.status(400);
    throw new Error(`Failed to create schedules: ${err.message}`);
  }
});

module.exports = {
    getSchedules,
    getScheduleById,
    createSchedule,
    bulkCreateSchedules,
    getSchedulesByClass,
    updateSchedule,
    deleteSchedule,
    deleteClassSchedules,
    getCurrentSchedules,
    bulkDeleteSchedules,
    uploadSchedulesCSV
}; 