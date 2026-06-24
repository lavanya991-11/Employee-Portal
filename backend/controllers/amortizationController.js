const AmortizationTemp = require('../models/amortizationTemp');
const { getEmployeeInstallments, bcConfigured } = require('../services/bcClient');

// POST /api/amortization — fetch installments from BC for the selected loan,
// refresh the temporary table (scoped to this user), and store the rows.
// Inquiry only: the data is read-only and replaced on every call.
exports.load = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }

        const { employeeCode, transactionNo, loanPayCode } = req.body;
        if (!employeeCode || !transactionNo || loanPayCode == null) {
            return res.status(400).json({ success: false, message: 'employeeCode, transactionNo and loanPayCode are required.' });
        }

        // Loan Pay Code is the BC finId.
        const result = await getEmployeeInstallments({ employeeCode, transactionNo, finId: loanPayCode });
        const installments = Array.isArray(result.installments) ? result.installments : [];

        const summary = {
            employeeCode: result.employeeCode || employeeCode,
            transactionNo,
            finId: Number(loanPayCode),
            totalAmount: Number(result.totalAmount) || 0,
            paidAmount: Number(result.paidAmount) || 0,
            remainingAmount: Number(result.remainingAmount) || 0
        };

        const docs = installments.map((it) => ({
            employee: req.user.id,
            ...summary,
            serialNumber: Number(it.serialNumber) || 0,
            payCodeDescription: it.payCodeDescription || '',
            dueDate: it.dueDate ? new Date(it.dueDate) : null,
            deductionDate: it.deductionDate ? new Date(it.deductionDate) : null,
            amount: Number(it.amount) || 0,
            isPaid: Boolean(it.isPaid),
            isShifted: Boolean(it.isShifted),
            isDisabled: Boolean(it.isDisabled),
            loanEncashmentNo: it.loanEncashmentNo || ''
        }));

        // Refresh the temp table for this user, then insert the latest rows.
        await AmortizationTemp.deleteMany({ employee: req.user.id });
        if (docs.length > 0) await AmortizationTemp.insertMany(docs, { ordered: false });

        res.json({ success: true, message: `Loaded ${docs.length} installment(s).`, summary, count: docs.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.bcMessage || 'Failed to load amortization', error: err.message });
    }
};

// GET /api/amortization — read the current user's temporary amortization rows.
exports.list = async (req, res) => {
    try {
        const items = await AmortizationTemp.find({ employee: req.user.id }).sort({ serialNumber: 1 });
        const s = items[0] || null;
        const summary = s ? {
            employeeCode: s.employeeCode, transactionNo: s.transactionNo, finId: s.finId,
            totalAmount: s.totalAmount, paidAmount: s.paidAmount, remainingAmount: s.remainingAmount
        } : null;
        res.json({ success: true, count: items.length, summary, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
