const express = require('express');
const router = express.Router();
const { getDevices, getDeviceById, createDevice, updateDevice, deleteDevice } = require('../controllers/rfidDeviceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getDevices)
    .post(protect, admin, createDevice);

router.route('/:id')
    .get(protect, getDeviceById)
    .put(protect, admin, updateDevice)
    .delete(protect, admin, deleteDevice);

module.exports = router; 