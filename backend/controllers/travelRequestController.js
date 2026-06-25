const TravelRequest = require('../models/travelRequest');
const EmployeeInfo = require('../models/employeeInfo');
const FinElement = require('../models/finElement');
const { submitEarningRequest, bcConfigured } = require('../services/bcClient');

// GET /api/travel-requests/earning-paycodes — Earning FIN Elements used to
// populate the Earning Pay Code dropdown on the Travel card.
exports.earningPayCodes = async (req, res) => {
    try {
        const items = await FinElement.find({ finType: 'Earning', isDisabled: { $ne: true } })
            .select('finId description description2')
            .sort({ finId: 1 });
        res.json({ success: true, count: items.length, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// POST /api/travel-requests — submit a travel (earning) request to BC and store
// it locally.
exports.submit = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }

        // Employee Code comes from the logged-in employee (not editable by the client).
        const info = await EmployeeInfo.findOne({ user: req.user.id });
        const employeeCode = info?.employeeCode || req.body.employeeCode;
        if (!employeeCode) {
            return res.status(400).json({ success: false, message: 'No Employee Code found for your account. Set it on the Employee Information page first.' });
        }

        const { comments, lines, attachments } = req.body;

        // Keep only complete lines (pay code + positive amount).
        const validLines = (Array.isArray(lines) ? lines : [])
            .map((l) => ({
                earningPayCode: Number(l.earningPayCode),
                earningPayCodeDesc: l.earningPayCodeDesc || '',
                amount: Number(l.amount),
                unitCount: Number(l.unitCount) || 1,
                earningDate: l.earningDate || ''
            }))
            .filter((l) => l.earningPayCode && l.amount > 0);

        if (validLines.length === 0) {
            return res.status(400).json({ success: false, message: 'Add at least one line with an Earning Pay Code and a positive Amount.' });
        }

        const cleanAttachments = (Array.isArray(attachments) ? attachments : [])
            .filter((a) => a && a.fileName && a.contentBase64);

        // Submit to BC -> { requestNo, status, totalAmount }
        const result = await submitEarningRequest({ employeeCode, comments, lines: validLines, attachments: cleanAttachments });
        if (!result || !result.requestNo) {
            return res.status(502).json({ success: false, message: 'Travel request was not accepted by Business Central.' });
        }

        // Auto-generate a local Document No.
        const count = await TravelRequest.countDocuments();
        const documentNo = `TREQ-${String(count + 1).padStart(6, '0')}`;

        const saved = await TravelRequest.create({
            employee: req.user.id,
            documentNo,
            employeeCode,
            comments: comments || '',
            lines: validLines,
            attachments: cleanAttachments.map((a) => ({ fileName: a.fileName, mimeType: a.mimeType })),
            totalAmount: Number(result.totalAmount) || validLines.reduce((s, l) => s + l.amount, 0),
            requestNo: result.requestNo,
            status: result.status || ''
        });

        res.status(201).json({
            success: true,
            message: `Travel request created. Request No: ${result.requestNo} (${result.status || 'Submitted'}).`,
            requestNo: result.requestNo,
            status: result.status || '',
            totalAmount: saved.totalAmount,
            request: saved
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.bcMessage || 'Failed to submit travel request', error: err.message });
    }
};

// GET /api/travel-requests/my — travel requests submitted by the logged-in employee.
exports.listMine = async (req, res) => {
    try {
        const items = await TravelRequest.find({ employee: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, count: items.length, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// GET /api/travel-requests/all — all travel requests (admin views).
exports.listAll = async (req, res) => {
    try {
        const items = await TravelRequest.find()
            .populate('employee', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: items.length, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
