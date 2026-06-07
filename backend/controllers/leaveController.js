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

        // Look up employeeCode and the live BC balance to decide if we need to split.
        const info = await EmployeeInfo.findOne({ user: req.user.id });
        const employeeCode = info?.employeeCode || null;

        let availableBalance = totalDays; // default: no split
        if (bcConfigured() && leaveFinId != null && employeeCode) {
            try {
                const result = await checkLeaveBalance(employeeCode, leaveFinId, toBcDate(fromDate));
                availableBalance = Number(result?.balance) || 0;
            } catch (_) { /* fall back to no-split */ }
        }

        // Build segments per the org's Pay Type rule:
        //   balance > 0 → those days are UnPaid (consume balance)
        //   balance = 0 → remaining days are Paid
        const segments = [];
        if (availableBalance <= 0) {
            segments.push({
                payType: 'Paid',
                fromDate: new Date(fromDate),
                toDate: new Date(toDate),
                totalDays
            });
        } else if (totalDays <= availableBalance) {
            segments.push({
                payType: 'Unpaid',
                fromDate: new Date(fromDate),
                toDate: new Date(toDate),
                totalDays
            });
        } else {
            const unpaidDays = availableBalance;          // first chunk: within balance → Unpaid
            const paidDays = totalDays - unpaidDays;      // overflow chunk → Paid
            const unpaidFrom = new Date(fromDate);
            const unpaidTo = new Date(fromDate);
            unpaidTo.setDate(unpaidTo.getDate() + unpaidDays - 1);
            const paidFrom = new Date(fromDate);
            paidFrom.setDate(paidFrom.getDate() + unpaidDays);
            segments.push({ payType: 'Unpaid', fromDate: unpaidFrom, toDate: unpaidTo, totalDays: unpaidDays });
            segments.push({ payType: 'Paid', fromDate: paidFrom, toDate: new Date(toDate), totalDays: paidDays });
        }

        // Generate a shared reference number for all segments of this application.
        const totalLeavesSoFar = await Leave.countDocuments();
        const leaveReferenceNumber = `PR${String(totalLeavesSoFar + 1).padStart(6, '0')}`;

        // Create each segment in MongoDB and push to BC.
        const leaves = [];
        const bc = [];
        for (const seg of segments) {
            const leave = await Leave.create({
                employee: req.user.id,
                leaveType,
                leaveFinId: leaveFinId ?? null,
                leaveReferenceNumber,
                payType: seg.payType,
                fromDate: seg.fromDate,
                toDate: seg.toDate,
                totalDays: seg.totalDays,
                reason: segments.length > 1 ? `${reason} (${seg.payType} part)` : reason
            });
            leaves.push(leave);

            if (bcConfigured() && leaveFinId != null && employeeCode) {
                try {
                    const result = await createEmployeeLeave({
                        employeeNumber: employeeCode,
                        payCode: leaveFinId,
                        leaveStartDate: toBcDate(seg.fromDate),
                        leaveEndDate: toBcDate(seg.toDate),
                        payType: toBcPayType(seg.payType),
                        leaveReferenceNumber
                    });
                    bc.push({ ok: true, payType: seg.payType, days: seg.totalDays, result });
                } catch (e) {
                    bc.push({ ok: false, payType: seg.payType, days: seg.totalDays, error: e.message });
                }
            }
        }

        const message = segments.length > 1
            ? `Leave split (${leaveReferenceNumber}): ${segments[0].totalDays} day(s) Unpaid + ${segments[1].totalDays} day(s) Paid.`
            : `Leave application submitted (${leaveReferenceNumber})`;

        res.status(201).json({ message, leaves, bc });
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
