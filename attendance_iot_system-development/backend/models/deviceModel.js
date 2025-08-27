const mongoose = require('mongoose');

const deviceSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    deviceId: {
        type: String,
        required: true,
        unique: true
    },
    assignedClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
    },
    lastPing: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Device', deviceSchema); 