const { generatePayslip, bcConfigured } = require('../services/bcClient');

// GET /api/payslip?calendarCode=2026&year=2026&payrollPeriod=1&employeeCode=1100
// Generates a single employee payslip from Business Central.
exports.generate = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }

        const { calendarCode, year, payrollPeriod, employeeCode } = req.query;
        if (!calendarCode || !payrollPeriod || !employeeCode) {
            return res.status(400).json({ success: false, message: 'calendarCode, payrollPeriod and employeeCode are required.' });
        }

        const payslip = await generatePayslip({ calendarCode, year, payrollPeriod, employeeCode });
        if (!payslip) {
            return res.status(404).json({ success: false, message: 'No payslip returned for the given selection.' });
        }

        res.json({ success: true, payslip });
    } catch (err) {
        // Clean BC's raw dialog text (drop the technical CorrelationId) and show
        // a friendly message when no payslip exists for the selection.
        let msg = (err.bcMessage || '').replace(/\s*CorrelationId\s*:.*$/i, '').trim();
        if (!msg || /no pay\s*slip|pay\s*slip was found|not found/i.test(msg)) {
            msg = 'No payslip found for the selected employee and period.';
        }
        res.status(500).json({ success: false, message: msg });
    }
};
