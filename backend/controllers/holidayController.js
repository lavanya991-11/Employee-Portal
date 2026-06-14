const { getHolidays, bcConfigured } = require('../services/bcClient');

exports.list = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }
        const items = await getHolidays();
        // Normalize to a consistent shape — handle BC's various field names.
        const holidays = (items || []).map((h) => ({
            date: h.date || h.holidayDate || h.startDate || h.day || null,
            name: h.description || h.name || h.holidayName || h.title || '',
            type: h.type || h.holidayType || ''
        })).filter((h) => h.date);
        res.json({ success: true, count: holidays.length, holidays });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch holidays from BC', error: err.message });
    }
};
