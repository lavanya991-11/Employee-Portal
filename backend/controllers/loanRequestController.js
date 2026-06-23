const LoanRequest = require('../models/loanRequest');
const EmployeeInfo = require('../models/employeeInfo');
const { submitLoanRequest, bcConfigured } = require('../services/bcClient');

// POST /api/loan-requests — submit a loan request to BC and store it locally.
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

        const { loanPayCode, loanAmount, installmentCalculation, noOfInstallments, comments } = req.body;
        if (loanPayCode == null || loanAmount == null) {
            return res.status(400).json({ success: false, message: 'Loan Pay Code and Amount are required.' });
        }

        // Submit to BC -> { requestNo, status }
        const result = await submitLoanRequest({ employeeCode, loanPayCode, loanAmount, installmentCalculation, noOfInstallments, comments });
        if (!result || !result.requestNo) {
            return res.status(502).json({ success: false, message: 'Loan request was not accepted by Business Central.' });
        }

        // Auto-generate a local Document No.
        const count = await LoanRequest.countDocuments();
        const documentNo = `LREQ-${String(count + 1).padStart(6, '0')}`;

        const saved = await LoanRequest.create({
            employee: req.user.id,
            documentNo,
            employeeCode,
            loanPayCode: Number(loanPayCode),
            loanAmount: Number(loanAmount),
            installmentCalculation: Number(installmentCalculation) || 0,
            noOfInstallments: Number(noOfInstallments) || 0,
            comments: comments || '',
            requestNo: result.requestNo,
            status: result.status || ''
        });

        res.status(201).json({
            success: true,
            message: `Loan request created. Request No: ${result.requestNo} (${result.status || 'Submitted'}).`,
            requestNo: result.requestNo,
            status: result.status || '',
            request: saved
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.bcMessage || 'Failed to submit loan request', error: err.message });
    }
};

// PATCH /api/loan-requests/by-ref/:requestNo — update status, comments and
// approvedBy for the loan request matching the given Request No.
exports.updateByRef = async (req, res) => {
    try {
        const { requestNo } = req.params;
        const { status, comments, approvedBy, approvedDate } = req.body;

        const update = {};
        if (status !== undefined) update.status = status;
        if (comments !== undefined) update.comments = comments;
        if (approvedBy !== undefined) update.approvedBy = approvedBy;
        if (approvedDate !== undefined) update.approvedDate = approvedDate ? new Date(approvedDate) : null;

        // Auto-stamp the approved date when the status becomes Approved/Rejected
        // and no explicit approvedDate was sent.
        const s = (status || '').toLowerCase();
        const isFinal = (s.includes('approv') && !s.includes('pending')) || s.includes('reject');
        if (approvedDate === undefined && status !== undefined && isFinal) {
            update.approvedDate = new Date();
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ success: false, message: 'Provide at least one of: status, comments, approvedBy, approvedDate.' });
        }

        const item = await LoanRequest.findOneAndUpdate({ requestNo }, { $set: update }, { new: true });
        if (!item) {
            return res.status(404).json({ success: false, message: `No loan request found with Request No ${requestNo}.` });
        }
        res.json({ success: true, message: `Loan request ${requestNo} updated.`, request: item });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// GET /api/loan-requests/my — loan requests submitted by the logged-in employee.
exports.listMine = async (req, res) => {
    try {
        const items = await LoanRequest.find({ employee: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, count: items.length, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
