const express = require('express');
const router = express.Router();
const { processRfidScan } = require('../controllers/rfidScanController');

// Public route - intended to be accessed by RFID hardware devices
router.post('/scan', processRfidScan);

module.exports = router; 