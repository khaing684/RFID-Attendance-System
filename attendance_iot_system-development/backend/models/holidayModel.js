const mongoose = require('mongoose');

const holidaySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Create index on date field for fast lookups
holidaySchema.index({ date: 1 });

const Holiday = mongoose.model('Holiday', holidaySchema);

module.exports = Holiday; 