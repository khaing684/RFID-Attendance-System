const mqtt = require('mqtt');
const Device = require('../models/deviceModel');
const Student = require('../models/studentModel');
const Class = require('../models/classModel');
const Schedule = require('../models/scheduleModel');

// MQTT Client configuration
const mqttClient = mqtt.connect('mqtt://temperature.intelimyanmar.com:1883', {
    clientId: 'attendance_server_' + Math.random().toString(16).substr(2, 8),
    clean: true
});

// Topics
const RFID_SCAN_TOPIC = 'rfid/scans';
const DEVICE_STATUS_TOPIC = 'rfid/devices/+/status';

// Handle connection
mqttClient.on('connect', () => {
    console.log('MQTT Client Connected');
    
    // Subscribe to topics
    mqttClient.subscribe(RFID_SCAN_TOPIC);
    mqttClient.subscribe(DEVICE_STATUS_TOPIC);
});

// Handle incoming messages
mqttClient.on('message', async (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        
        if (topic === RFID_SCAN_TOPIC) {
            // Handle RFID scan
            const { rfidId, deviceId, timestamp } = data;
            
            // Find student by RFID ID
            const student = await Student.findOne({ rfidId });
            if (!student) {
                console.log(`No student found with RFID ID: ${rfidId}`);
                return;
            }

            // Find device
            const device = await Device.findById(deviceId);
            if (!device) {
                console.log(`No device found with ID: ${deviceId}`);
                return;
            }

            // Find current schedule
            const now = new Date();
            const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const currentTime = now.toLocaleTimeString('en-US', { hour12: false });

            const schedule = await Schedule.findOne({
                class: student.class,
                day: dayOfWeek,
                startTime: { $lte: currentTime },
                endTime: { $gte: currentTime }
            });

            // Create scan data
            const scanData = {
                student: {
                    _id: student._id,
                    name: student.name,
                    studentId: student.studentId
                },
                class: student.class,
                schedule: schedule ? {
                    _id: schedule._id,
                    day: schedule.day,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    subject: schedule.subject
                } : null,
                rfidDevice: {
                    _id: device._id,
                    name: device.name,
                    location: device.location
                },
                checkinTime: new Date(timestamp),
                status: schedule ? 'present' : 'late'
            };

            // Publish scan data to WebSocket clients
            mqttClient.publish('rfid/scan-data', JSON.stringify(scanData));
        }
        else if (topic.startsWith('rfid/devices/')) {
            // Handle device status updates
            const deviceId = topic.split('/')[3];
            const status = data.status;
            
            await Device.findByIdAndUpdate(deviceId, { status });
        }
    } catch (error) {
        console.error('Error processing MQTT message:', error);
    }
});

// Handle errors
mqttClient.on('error', (error) => {
    console.error('MQTT Client Error:', error);
});

module.exports = mqttClient; 