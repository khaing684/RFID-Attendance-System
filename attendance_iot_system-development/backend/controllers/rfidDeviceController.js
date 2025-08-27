const RfidDevice = require('../models/rfidDeviceModel');

// @desc    Get all RFID devices
// @route   GET /api/rfid-devices
// @access  Private
const getDevices = async (req, res) => {
    try {
        const devices = await RfidDevice.find({}).populate('class', 'name');
        res.json(devices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get RFID device by ID
// @route   GET /api/rfid-devices/:id
// @access  Private
const getDeviceById = async (req, res) => {
    try {
        const device = await RfidDevice.findById(req.params.id).populate('class', 'name');
        
        if (device) {
            res.json(device);
        } else {
            res.status(404).json({ message: 'Device not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an RFID device
// @route   POST /api/rfid-devices
// @access  Private/Admin
const createDevice = async (req, res) => {
    try {
        const { deviceId, name, location, class: classId } = req.body;
        
        const device = await RfidDevice.create({
            deviceId,
            name,
            location,
            class: classId,
            lastSeen: new Date()
        });
        
        res.status(201).json(device);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an RFID device
// @route   PUT /api/rfid-devices/:id
// @access  Private/Admin
const updateDevice = async (req, res) => {
    try {
        const device = await RfidDevice.findById(req.params.id);
        
        if (device) {
            device.deviceId = req.body.deviceId || device.deviceId;
            device.name = req.body.name || device.name;
            device.location = req.body.location || device.location;
            device.class = req.body.class || device.class;
            device.active = req.body.active !== undefined ? req.body.active : device.active;
            device.lastSeen = req.body.lastSeen || device.lastSeen;
            
            const updatedDevice = await device.save();
            res.json(updatedDevice);
        } else {
            res.status(404).json({ message: 'Device not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an RFID device
// @route   DELETE /api/rfid-devices/:id
// @access  Private/Admin
const deleteDevice = async (req, res) => {
    try {
        const device = await RfidDevice.findById(req.params.id);
        
        if (device) {
            await device.deleteOne();
            res.json({ message: 'Device removed' });
        } else {
            res.status(404).json({ message: 'Device not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDevices,
    getDeviceById,
    createDevice,
    updateDevice,
    deleteDevice
}; 