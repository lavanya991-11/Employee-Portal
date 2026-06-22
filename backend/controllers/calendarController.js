const Calendar = require('../models/calendar');
const { getCalendars, bcConfigured } = require('../services/bcClient');

// Map a BC calendar row onto the Mongoose model, keeping only known fields.
const mapBcToModel = (bc) => ({
    calendarCode: bc.calendarCode,
    description: bc.description || '',
    calendarYear: Number(bc.calendarYear) || 0,
    payrollPeriod: bc.payrollPeriod || '',
    workingDaysPerMonth: Number(bc.workingDaysPerMonth) || 0,
    calendarType: bc.calendarType || ''
});

// GET /api/calendars — list the locally stored calendar records.
exports.list = async (req, res) => {
    try {
        const items = await Calendar.find().sort({ calendarCode: 1 });
        res.json({ success: true, count: items.length, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// POST /api/calendars/scan — refresh from BC:
//   1. call the BC OData web service and retrieve the latest calendars
//   2. delete all existing Calendar records
//   3. insert the freshly retrieved records
// The fetch happens before the delete so a failed call leaves existing data intact.
exports.scan = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }

        const rows = await getCalendars();
        const docs = rows
            .filter((r) => r && r.calendarCode)
            .map(mapBcToModel);

        const deleted = await Calendar.deleteMany({});
        let inserted = [];
        if (docs.length > 0) {
            inserted = await Calendar.insertMany(docs, { ordered: false });
        }

        res.json({
            success: true,
            message: `Scanned calendars from BC — removed ${deleted.deletedCount}, inserted ${inserted.length}.`,
            fetched: rows.length,
            deleted: deleted.deletedCount,
            inserted: inserted.length
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Calendar scan failed', error: err.message });
    }
};
