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

const setupTestData = async () => {
    try {
        console.log('Setting up RFID test data...\n');

        // 1. Create a test class
        const testClass = await Class.create({
            name: 'Test Class A'
        });
        console.log('✅ Created test class:', testClass.name);

        // 2. Create a test RFID device
        const testDevice = await RfidDevice.create({
            deviceId: 'TEST001',
            name: 'Test Device 1',
            location: 'Room 101',
            class: testClass._id,
            active: true
        });
        console.log('✅ Created test device:', testDevice.name);

        // 3. Create test students
        const testStudents = await Student.create([
            {
                name: 'John Doe',
                studentId: 'STU001',
                rfidId: 'RFID001',
                email: 'john@test.com',
                class: testClass._id,
                active: true
            },
            {
                name: 'Jane Smith',
                studentId: 'STU002',
                rfidId: 'RFID002',
                email: 'jane@test.com',
                class: testClass._id,
                active: true
            }
        ]);
        console.log('✅ Created test students:', testStudents.map(s => s.name).join(', '));

        // 4. Create test schedules
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        
        // Create schedules for the current day
        const testSchedules = await Schedule.create([
            {
                class: testClass._id,
                day: currentDay,
                startTime: '09:00',
                endTime: '10:30',
                active: true
            },
            {
                class: testClass._id,
                day: currentDay,
                startTime: '11:00',
                endTime: '12:30',
                active: true
            }
        ]);
        console.log('✅ Created test schedules for', currentDay);

        console.log('\nTest data setup complete!');
        console.log('\nYou can now test RFID scanning with:');
        console.log('1. Device ID:', testDevice.deviceId);
        console.log('2. Student RFID IDs:', testStudents.map(s => s.rfidId).join(', '));
        console.log('\nExample API call:');
        console.log('POST /api/rfid-scan');
        console.log('Body: {');
        console.log('  "rfidId": "RFID001",');
        console.log('  "deviceId": "TEST001"');
        console.log('}');

    } catch (error) {
        console.error('Error setting up test data:', error);
    } finally {
        mongoose.disconnect();
    }
};

setupTestData(); 