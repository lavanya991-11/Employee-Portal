const CalendarPeriod = require('../models/calendarPeriod');
const { getCalendarPeriods, bcConfigured } = require('../services/bcClient');

// Map a BC calendar period row onto the Mongoose model.
const mapBcToModel = (bc) => ({
    periodNo: Number(bc.periodNo) || 0,
    month: Number(bc.month) || 0,
    year: Number(bc.year) || 0,
    calendarStartDate: bc.calendarStartDate ? new Date(bc.calendarStartDate) : null,
    calendarEndDate: bc.calendarEndDate ? new Date(bc.calendarEndDate) : null,
    payPeriodStatus: bc.payPeriodStatus || '',
    isPosted: Boolean(bc.isPosted)
});

// GET /api/calendar-periods/by-calendar?calendarCode=2026&year=2026
// Fetch periods live from BC filtered by BOTH calendar code and year. Used by
// the Payslip page's Payroll Period lookup, which must show only the periods
// belonging to the selected calendar/year (the local table has no calendarCode).
exports.byCalendar = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }
        const { calendarCode, year } = req.query;
        if (!calendarCode) {
            return res.status(400).json({ success: false, message: 'calendarCode is required.' });
        }

        const rows = await getCalendarPeriods({ calendarCode, year: Number(year) || 0 });
        const items = rows
            .filter(Boolean)
            .map(mapBcToModel)
            .sort((a, b) => a.periodNo - b.periodNo);

        res.json({ success: true, count: items.length, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load calendar periods from BC', error: err.message });
    }
};

// GET /api/calendar-periods — list the locally stored calendar period records.
exports.list = async (req, res) => {
    try {
        const items = await CalendarPeriod.find().sort({ year: 1, periodNo: 1 });
        res.json({ success: true, count: items.length, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// POST /api/calendar-periods/scan — refresh from BC:
//   1. call the BC OData web service and retrieve the latest periods
//   2. delete all existing CalendarPeriod records
//   3. insert the freshly retrieved records
// The fetch happens before the delete so a failed call leaves existing data intact.
exports.scan = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }

        const rows = await getCalendarPeriods({ calendarCode: 'ALL', year: 0 });
        const docs = rows.filter(Boolean).map(mapBcToModel);

        const deleted = await CalendarPeriod.deleteMany({});
        let inserted = [];
        if (docs.length > 0) {
            inserted = await CalendarPeriod.insertMany(docs, { ordered: false });
        }

        res.json({
            success: true,
            message: `Scanned calendar periods from BC — removed ${deleted.deletedCount}, imported ${inserted.length}.`,
            fetched: rows.length,
            deleted: deleted.deletedCount,
            inserted: inserted.length
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Calendar periods scan failed', error: err.message });
    }
};

// DELETE /api/calendar-periods/all — remove every calendar period record.
exports.removeAll = async (req, res) => {
    try {
        const result = await CalendarPeriod.deleteMany({});
        res.json({ success: true, message: `Deleted ${result.deletedCount} calendar period(s).`, deleted: result.deletedCount });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// DELETE /api/calendar-periods/:id — remove a single calendar period record.
exports.remove = async (req, res) => {
    try {
        const item = await CalendarPeriod.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Calendar period deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
