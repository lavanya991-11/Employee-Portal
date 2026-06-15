const { getHolidays, bcConfigured } = require('../services/bcClient');

// GET /api/holidays?year=2026 — runtime fetch from BC. Nothing stored.
exports.list = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }
        const items = await getHolidays();
        let holidays = (items || []).map((h) => ({
            fromDate: h.fromDate || h.startDate || h.date || h.holidayDate || h.day || null,
            toDate: h.toDate || h.endDate || h.date || h.holidayDate || h.day || null,
            description: h.description || h.name || h.holidayName || h.title || ''
        })).filter((h) => h.fromDate);

        const yearFilter = req.query.year ? Number(req.query.year) : null;
        if (yearFilter && !Number.isNaN(yearFilter)) {
            holidays = holidays.filter((h) => new Date(h.fromDate).getFullYear() === yearFilter);
        }
        holidays.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));

        res.json({ success: true, count: holidays.length, year: yearFilter || null, holidays });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch holidays from BC', error: err.message });
    }
};
