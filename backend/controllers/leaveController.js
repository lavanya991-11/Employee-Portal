const Leave = require('../models/leave');
const EmployeeInfo = require('../models/employeeInfo');
const { checkLeaveBalance, bcConfigured } = require('../services/bcClient');

const calculateDays = (from, to) => {
    const diff = new Date(to) - new Date(from);
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

exports.applyLeave = async (req, res) => {
    try {
        const { leaveType, leaveFinId, payType, fromDate, toDate, reason } = req.body;

        if (new Date(toDate) < new Date(fromDate)) {
            return res.status(400).json({ message: "toDate cannot be before fromDate" });
        }

        const totalDays = calculateDays(fromDate, toDate);

        const leave = await Leave.create({
            employee: req.user.id,
            leaveType,
            leaveFinId: leaveFinId ?? null,
            payType: payType || 'Paid',
            fromDate,
            toDate,
            totalDays,
            reason
        });

        res.status(201).json({
            message: "Leave application submitted",
            leave
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.bcLeaveBalance = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }
        const { finId, asOfDate } = req.query;
        if (finId == null || finId === '') {
            return res.status(400).json({ success: false, message: 'finId is required' });
        }
        const info = await EmployeeInfo.findOne({ user: req.user.id });
        if (!info || !info.employeeCode) {
            return res.status(400).json({ success: false, message: 'Your Employee Information has no employeeCode. Set it on the Employee Information page first.' });
        }
        const result = await checkLeaveBalance(info.employeeCode, finId, asOfDate);
        res.json({ success: true, employeeCode: info.employeeCode, finId: Number(finId), result });
    } catch (err) {
        res.status(500).json({ success: false, message: 'BC leave balance check failed', error: err.message });
    }
};

exports.getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ employee: req.user.id }).sort({ createdAt: -1 });
        res.json({ count: leaves.length, leaves });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate('employee', 'name email')
            .sort({ createdAt: -1 });
        res.json({ count: leaves.length, leaves });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approverRemarks } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Status must be Approved or Rejected" });
        }

        const leave = await Leave.findById(id);
        if (!leave) {
            return res.status(404).json({ message: "Leave not found" });
        }

        leave.status = status;
        leave.approverRemarks = approverRemarks || '';
        leave.approvedBy = req.user.id;
        await leave.save();

        res.json({ message: `Leave ${status.toLowerCase()}`, leave });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
