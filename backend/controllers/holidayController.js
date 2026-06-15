const { getHolidays, bcConfigured } = require('../services/bcClient');

// Fallback list (used when BC has no holidays endpoint published).
const FALLBACK_HOLIDAYS = [
    { fromDate: '2026-01-01', toDate: '2026-01-01', description: 'New Year' },
    { fromDate: '2026-01-14', toDate: '2026-01-14', description: 'Pongal' },
    { fromDate: '2026-01-26', toDate: '2026-01-26', description: 'Republic Day' },
    { fromDate: '2026-03-19', toDate: '2026-03-19', description: 'Holi' },
    { fromDate: '2026-04-10', toDate: '2026-04-10', description: 'Good Friday' },
    { fromDate: '2026-05-01', toDate: '2026-05-01', description: 'Labour Day' },
    { fromDate: '2026-08-15', toDate: '2026-08-15', description: 'Independence Day' },
    { fromDate: '2026-09-07', toDate: '2026-09-07', description: 'Ganesh Chaturthi' },
    { fromDate: '2026-10-02', toDate: '2026-10-02', description: 'Gandhi Jayanti' },
    { fromDate: '2026-10-20', toDate: '2026-10-20', description: 'Dussehra' },
    { fromDate: '2026-11-08', toDate: '2026-11-08', description: 'Diwali' },
    { fromDate: '2026-12-25', toDate: '2026-12-25', description: 'Christmas' },
    { fromDate: '2027-01-01', toDate: '2027-01-01', description: 'New Year' },
    { fromDate: '2025-01-01', toDate: '2025-01-01', description: 'New Year' },
    { fromDate: '2025-12-25', toDate: '2025-12-25', description: 'Christmas' }
];

// GET /api/holidays?year=2026 — runtime fetch from BC, falls back to a hardcoded list if BC has no endpoint.
exports.list = async (req, res) => {
    let holidays = [];
    let source = 'bc';

    if (bcConfigured()) {
        try {
            const items = await getHolidays();
            holidays = (items || []).map((h) => ({
                fromDate: h.fromDate || h.startDate || h.date || h.holidayDate || h.day || null,
                toDate: h.toDate || h.endDate || h.date || h.holidayDate || h.day || null,
                description: h.description || h.name || h.holidayName || h.title || ''
            })).filter((h) => h.fromDate);
        } catch (err) {
            if (err.bcNotFound) {
                holidays = [...FALLBACK_HOLIDAYS];
                source = 'fallback';
            } else {
                return res.status(500).json({ success: false, message: 'Failed to fetch holidays from BC', error: err.message });
            }
        }
    } else {
        holidays = [...FALLBACK_HOLIDAYS];
        source = 'fallback';
    }

    const yearFilter = req.query.year ? Number(req.query.year) : null;
    if (yearFilter && !Number.isNaN(yearFilter)) {
        holidays = holidays.filter((h) => new Date(h.fromDate).getFullYear() === yearFilter);
    }
    holidays.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));

    res.json({ success: true, source, count: holidays.length, year: yearFilter || null, holidays });
};
