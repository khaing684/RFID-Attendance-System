const mongoose = require('mongoose');

const rfidDeviceSchema = mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    active: {
        type: Boolean,
        default: true
    },
    lastSeen: {
        type: Date
    }
}, {
    timestamps: true
});

const RfidDevice = mongoose.model('RfidDevice', rfidDeviceSchema);
module.exports = RfidDevice; 