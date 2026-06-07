const Leave = require('../models/leave');
const EmployeeInfo = require('../models/employeeInfo');
const { checkLeaveBalance, createEmployeeLeave, bcConfigured } = require('../services/bcClient');

const toBcPayType = (p) => {
    if (p === 'Unpaid') return 'UnPaidLeave';
    return 'PaidLeave'; // Paid + Half Paid both go in as PaidLeave
};
const toBcDate = (d) => new Date(d).toISOString().slice(0, 10);

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

        // Block duplicate / overlapping leave for this employee.
        const overlap = await Leave.findOne({
            employee: req.user.id,
            status: { $in: ['Pending', 'Approved'] },
            fromDate: { $lte: new Date(toDate) },
            toDate: { $gte: new Date(fromDate) }
        });
        if (overlap) {
            const f = new Date(overlap.fromDate).toLocaleDateString('en-GB');
            const t = new Date(overlap.toDate).toLocaleDateString('en-GB');
            return res.status(400).json({
                message: `You already have a ${overlap.status.toLowerCase()} ${overlap.leaveType} leave from ${f} to ${t}. Cannot create another leave on the same date.`
            });
        }

        const totalDays = calculateDays(fromDate, toDate);

        const info = await EmployeeInfo.findOne({ user: req.user.id });
        const employeeCode = info?.employeeCode || null;

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

        // Best-effort push to Business Central.
        let bcResult = null;
        let bcError = null;
        if (bcConfigured() && leaveFinId != null && employeeCode) {
            try {
                bcResult = await createEmployeeLeave({
                    employeeNumber: employeeCode,
                    payCode: leaveFinId,
                    leaveStartDate: toBcDate(fromDate),
                    leaveEndDate: toBcDate(toDate),
                    payType: toBcPayType(payType || 'Paid')
                });
            } catch (e) {
                bcError = e.message;
            }
        } else if (!employeeCode) {
            bcError = 'EmployeeInfo missing employeeCode — BC not called.';
        }

        res.status(201).json({
            message: 'Leave application submitted',
            leave,
            bc: bcResult ? { ok: true, result: bcResult } : (bcError ? { ok: false, error: bcError } : null)
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

exports.updateMyLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave not found' });
        if (String(leave.employee) !== String(req.user.id)) {
            return res.status(403).json({ message: 'You can only edit your own leaves' });
        }
        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot edit a ${leave.status.toLowerCase()} leave` });
        }
        const { leaveType, leaveFinId, payType, fromDate, toDate, reason } = req.body;
        if (new Date(toDate) < new Date(fromDate)) {
            return res.status(400).json({ message: 'toDate cannot be before fromDate' });
        }
        // Block overlap with OTHER leaves (excluding this one).
        const overlap = await Leave.findOne({
            _id: { $ne: leave._id },
            employee: req.user.id,
            status: { $in: ['Pending', 'Approved'] },
            fromDate: { $lte: new Date(toDate) },
            toDate: { $gte: new Date(fromDate) }
        });
        if (overlap) {
            const f = new Date(overlap.fromDate).toLocaleDateString('en-GB');
            const t = new Date(overlap.toDate).toLocaleDateString('en-GB');
            return res.status(400).json({
                message: `You already have a ${overlap.status.toLowerCase()} ${overlap.leaveType} leave from ${f} to ${t}.`
            });
        }
        leave.leaveType = leaveType ?? leave.leaveType;
        leave.leaveFinId = leaveFinId ?? leave.leaveFinId;
        leave.payType = payType ?? leave.payType;
        leave.fromDate = fromDate ?? leave.fromDate;
        leave.toDate = toDate ?? leave.toDate;
        leave.reason = reason ?? leave.reason;
        leave.totalDays = calculateDays(leave.fromDate, leave.toDate);
        await leave.save();
        res.json({ message: 'Leave updated', leave });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getOneMyLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave not found' });
        if (String(leave.employee) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Not your leave' });
        }
        res.json({ leave });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
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
