const Holiday = require('../models/holiday');

exports.list = async (req, res) => {
    try {
        const filter = {};
        if (req.query.year) {
            const y = Number(req.query.year);
            filter.fromDate = {
                $gte: new Date(`${y}-01-01T00:00:00.000Z`),
                $lt: new Date(`${y + 1}-01-01T00:00:00.000Z`)
            };
        }
        const holidays = await Holiday.find(filter).sort({ fromDate: 1 });
        res.json({ success: true, count: holidays.length, year: req.query.year || null, holidays });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { fromDate, toDate, description } = req.body;
        if (!fromDate || !toDate || !description) {
            return res.status(400).json({ success: false, message: 'fromDate, toDate, and description are required' });
        }
        if (new Date(toDate) < new Date(fromDate)) {
            return res.status(400).json({ success: false, message: 'toDate cannot be before fromDate' });
        }
        const created = await Holiday.create({
            fromDate,
            toDate,
            description,
            createdBy: req.user.id
        });
        res.status(201).json({ success: true, message: 'Holiday created', holiday: created });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const holiday = await Holiday.findById(req.params.id);
        if (!holiday) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, holiday });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { fromDate, toDate, description } = req.body;
        const holiday = await Holiday.findById(req.params.id);
        if (!holiday) return res.status(404).json({ success: false, message: 'Not found' });
        if (fromDate) holiday.fromDate = fromDate;
        if (toDate) holiday.toDate = toDate;
        if (description) holiday.description = description;
        if (new Date(holiday.toDate) < new Date(holiday.fromDate)) {
            return res.status(400).json({ success: false, message: 'toDate cannot be before fromDate' });
        }
        await holiday.save();
        res.json({ success: true, message: 'Holiday updated', holiday });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const holiday = await Holiday.findByIdAndDelete(req.params.id);
        if (!holiday) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Holiday deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
