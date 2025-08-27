const Student = require('../models/studentModel');
const Class = require('../models/classModel');
const Schedule = require('../models/scheduleModel');
const Attendance = require('../models/attendanceModel');
const RfidDevice = require('../models/rfidDeviceModel');
const Holiday = require('../models/holidayModel');

// @desc    Process RFID card scan
// @route   POST /api/rfid-scan
// @access  Public (meant for RFID devices)
const processRfidScan = async (req, res) => {
  try {
    const { rfidId, deviceId } = req.body;
    
    if (!rfidId || !deviceId) {
      return res.status(400).json({ message: 'RFID ID and device ID are required' });
    }
    
    // Find the device and populate its class information
    const device = await RfidDevice.findOne({ deviceId }).populate('class');
    if (!device) {
      return res.status(404).json({ message: 'RFID device not found' });
    }
    
    // Update device last seen
    device.lastSeen = new Date();
    await device.save();
    
    // Find the student with this RFID and populate their class
    const student = await Student.findOne({ rfidId }).populate('class');
    if (!student) {
      return res.status(404).json({ message: 'Student not found with this RFID' });
    }

    // Check if student is active
    if (!student.active) {
      return res.status(403).json({ 
        message: 'Your student account is inactive. Please contact your administrator.',
        details: {
          studentId: student.studentId,
          name: student.name
        }
      });
    }

    // Check if student has an assigned class
    if (!student.class) {
      return res.status(403).json({ 
        message: 'You are not assigned to any class. Please contact your administrator.',
        details: {
          studentId: student.studentId,
          name: student.name
        }
      });
    }
    
    // Verify if the device is assigned to a class
    if (!device.class) {
      return res.status(400).json({ message: 'This device is not assigned to any class' });
    }

    // Verify if student belongs to the class they're trying to mark attendance for
    if (student.class._id.toString() !== device.class._id.toString()) {
      return res.status(403).json({ 
        message: 'You can only mark attendance for your assigned class',
        details: {
          studentName: student.name,
          studentId: student.studentId,
          studentClass: student.class.name,
          deviceClass: device.class.name,
          deviceLocation: device.location
        }
      });
    }
    
    // Get current time and day
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    
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
      return res.status(400).json({ 
        message: 'Today is a holiday, no attendance will be recorded',
        holiday: holiday
      });
    }
    
    // Format current time as HH:MM
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    // Find active schedule for this class, day and time
    let schedule = await Schedule.findOne({
      class: device.class._id,
      day: currentDay,
      active: true,
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime }
    });
    
    if (!schedule) {
      return res.status(404).json({ 
        message: 'No active schedule found for this time',
        details: { 
          day: currentDay, 
          time: currentTime,
          class: device.class.name 
        }
      });
    }
    
    // Determine attendance status (on time or late)
    const classStartTimeStr = schedule.startTime;
    const [startHours, startMinutes] = classStartTimeStr.split(':').map(Number);
    
    const classStartTime = new Date(now);
    classStartTime.setHours(startHours, startMinutes, 0);
    
    const timeDiff = Math.floor((now - classStartTime) / (1000 * 60)); // diff in minutes
    let status = 'present';
    if (timeDiff > 15) {
      status = 'late';
    }
    
    // Check if attendance already recorded for this student, class, schedule and date
    const existingAttendance = await Attendance.findOne({
      student: student._id,
      class: device.class._id,
      schedule: schedule._id,
      date: { $gte: today, $lt: endOfDay }
    });
    
    if (existingAttendance) {
      // Return the existing attendance record
      const populatedAttendance = await Attendance.findById(existingAttendance._id)
        .populate('student', 'name studentId')
        .populate('class', 'name')
        .populate('schedule', 'day startTime endTime')
        .populate('rfidDevice', 'name location');
      
      return res.status(200).json({ 
        message: 'Attendance already recorded',
        attendanceRecord: populatedAttendance
      });
    }
    
    // Create attendance record
    const attendance = await Attendance.create({
      student: student._id,
      class: device.class._id,
      schedule: schedule._id,
      date: now,
      status,
      rfidDevice: device._id,
      checkinTime: now,
      notes: status === 'present' ? 'Recorded by RFID scan' : `Late by ${timeDiff} minutes`
    });
    
    // Populate the response data
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('student', 'name studentId')
      .populate('class', 'name')
      .populate('schedule', 'day startTime endTime')
      .populate('rfidDevice', 'name location');
    
    res.status(201).json({
      message: 'Attendance recorded successfully',
      attendanceRecord: populatedAttendance,
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId
      },
      class: {
        id: device.class._id,
        name: device.class.name
      },
      status,
      time: now
    });
    
  } catch (error) {
    console.error('RFID Scan error:', error);
    res.status(500).json({ message: 'Server error processing RFID scan' });
  }
};

module.exports = {
  processRfidScan
}; 