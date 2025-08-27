const Holiday = require('../models/holidayModel');

// @desc    Create a new holiday
// @route   POST /api/holidays
// @access  Private/Admin
const createHoliday = async (req, res) => {
    try {
        const { name, date, description } = req.body;
        
        const holiday = await Holiday.create({
            name,
            date: new Date(date),
            description
        });
        
        res.status(201).json(holiday);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk upload holidays
// @route   POST /api/holidays/bulk
// @access  Private/Admin
const bulkCreateHolidays = async (req, res) => {
    try {
        const { holidays } = req.body;
        
        if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of holidays' });
        }
        
        const formattedHolidays = holidays.map(holiday => ({
            ...holiday,
            date: new Date(holiday.date)
        }));
        
        const createdHolidays = await Holiday.insertMany(formattedHolidays);
        
        res.status(201).json(createdHolidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all holidays
// @route   GET /api/holidays
// @access  Private
const getHolidays = async (req, res) => {
    try {
        const { year, month } = req.query;
        let query = { active: true };
        
        if (year) {
            const startDate = new Date(parseInt(year), 0, 1);
            const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
            query.date = { $gte: startDate, $lte: endDate };
        }
        
        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            query.date = { $gte: startDate, $lte: endDate };
        }
        
        const holidays = await Holiday.find(query).sort({ date: 1 });
        
        res.json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get holiday by ID
// @route   GET /api/holidays/:id
// @access  Private
const getHolidayById = async (req, res) => {
    try {
        const holiday = await Holiday.findById(req.params.id);
        
        if (holiday) {
            res.json(holiday);
        } else {
            res.status(404).json({ message: 'Holiday not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update holiday
// @route   PUT /api/holidays/:id
// @access  Private/Admin
const updateHoliday = async (req, res) => {
    try {
        const { name, date, description, active } = req.body;
        
        const holiday = await Holiday.findById(req.params.id);
        
        if (holiday) {
            holiday.name = name || holiday.name;
            holiday.date = date ? new Date(date) : holiday.date;
            holiday.description = description !== undefined ? description : holiday.description;
            holiday.active = active !== undefined ? active : holiday.active;
            
            const updatedHoliday = await holiday.save();
            res.json(updatedHoliday);
        } else {
            res.status(404).json({ message: 'Holiday not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete holiday
// @route   DELETE /api/holidays/:id
// @access  Private/Admin
const deleteHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.findById(req.params.id);
        
        if (holiday) {
            await holiday.deleteOne();
            res.json({ message: 'Holiday removed' });
        } else {
            res.status(404).json({ message: 'Holiday not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check if a date is a holiday
// @route   GET /api/holidays/check/:date
// @access  Private
const checkIfHoliday = async (req, res) => {
    try {
        const dateToCheck = new Date(req.params.date);
        
        // Reset time to 00:00:00 to match any holiday on that day
        dateToCheck.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(dateToCheck);
        endOfDay.setHours(23, 59, 59, 999);
        
        const holiday = await Holiday.findOne({
            date: { $gte: dateToCheck, $lte: endOfDay },
            active: true
        });
        
        if (holiday) {
            res.json({ isHoliday: true, holiday });
        } else {
            res.json({ isHoliday: false });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createHoliday,
    bulkCreateHolidays,
    getHolidays,
    getHolidayById,
    updateHoliday,
    deleteHoliday,
    checkIfHoliday
}; 