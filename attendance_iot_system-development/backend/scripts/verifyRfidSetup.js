const mongoose = require('mongoose');
const Student = require('../models/studentModel');
const RfidDevice = require('../models/rfidDeviceModel');
const Schedule = require('../models/scheduleModel');
const Class = require('../models/classModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/school_attendance', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const verifyRfidSetup = async () => {
    try {
        console.log('Verifying RFID Setup...\n');

        // 1. Check Students with RFID
        const students = await Student.find({}).populate('class');
        console.log('Students with RFID:');
        if (students.length === 0) {
            console.log('❌ No students found with RFID IDs');
        } else {
            console.log(`✅ Found ${students.length} students`);
            students.forEach(student => {
                console.log(`- ${student.name} (ID: ${student.studentId}, RFID: ${student.rfidId}, Class: ${student.class?.name || 'Not assigned'})`);
            });
        }
        console.log('\n');

        // 2. Check RFID Devices
        const devices = await RfidDevice.find({}).populate('class');
        console.log('RFID Devices:');
        if (devices.length === 0) {
            console.log('❌ No RFID devices found');
        } else {
            console.log(`✅ Found ${devices.length} devices`);
            devices.forEach(device => {
                console.log(`- ${device.name} (ID: ${device.deviceId}, Location: ${device.location}, Class: ${device.class?.name || 'Not assigned'})`);
            });
        }
        console.log('\n');

        // 3. Check Classes
        const classes = await Class.find({});
        console.log('Classes:');
        if (classes.length === 0) {
            console.log('❌ No classes found');
        } else {
            console.log(`✅ Found ${classes.length} classes`);
            classes.forEach(cls => {
                console.log(`- ${cls.name}`);
            });
        }
        console.log('\n');

        // 4. Check Schedules
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;

        const schedules = await Schedule.find({
            day: currentDay,
            active: true,
            startTime: { $lte: currentTime },
            endTime: { $gte: currentTime }
        }).populate('class');

        console.log('Active Schedules for Current Time:');
        if (schedules.length === 0) {
            console.log(`❌ No active schedules found for ${currentDay} at ${currentTime}`);
        } else {
            console.log(`✅ Found ${schedules.length} active schedules`);
            schedules.forEach(schedule => {
                console.log(`- ${schedule.class.name}: ${schedule.startTime} - ${schedule.endTime}`);
            });
        }
        console.log('\n');

        // 5. Check Data Relationships
        console.log('Checking Data Relationships:');
        
        // Check if students have valid class assignments
        const studentsWithoutClass = students.filter(s => !s.class);
        if (studentsWithoutClass.length > 0) {
            console.log(`❌ Found ${studentsWithoutClass.length} students without class assignments`);
        } else {
            console.log('✅ All students have class assignments');
        }

        // Check if devices have valid class assignments
        const devicesWithoutClass = devices.filter(d => !d.class);
        if (devicesWithoutClass.length > 0) {
            console.log(`❌ Found ${devicesWithoutClass.length} devices without class assignments`);
        } else {
            console.log('✅ All devices have class assignments');
        }

        // Check if schedules exist for all classes
        const classesWithoutSchedules = classes.filter(cls => 
            !schedules.some(s => s.class._id.toString() === cls._id.toString())
        );
        if (classesWithoutSchedules.length > 0) {
            console.log(`❌ Found ${classesWithoutSchedules.length} classes without active schedules for current time`);
        } else {
            console.log('✅ All classes have active schedules for current time');
        }

    } catch (error) {
        console.error('Error verifying RFID setup:', error);
    } finally {
        mongoose.disconnect();
    }
};

verifyRfidSetup(); 