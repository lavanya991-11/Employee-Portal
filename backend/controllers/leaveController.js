const Leave = require('../models/leave');
const EmployeeInfo = require('../models/employeeInfo');
const User = require('../models/user');
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
        const { leaveType, leaveFinId, payType, fromDate, toDate, reason, saveOnly, replaceDraftId } = req.body;

        if (new Date(toDate) < new Date(fromDate)) {
            return res.status(400).json({ message: "toDate cannot be before fromDate" });
        }

        // If we're posting/saving over an existing unposted draft of ours, remove it first.
        if (replaceDraftId) {
            await Leave.findOneAndDelete({
                _id: replaceDraftId,
                employee: req.user.id,
                isPosted: false
            });
        }

        // Overlap check only when actually posting (not when saving a draft).
        if (!saveOnly) {
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
        }

        const totalDays = calculateDays(fromDate, toDate);

        // saveOnly: just save to MongoDB, no BC call, no split.
        if (saveOnly) {
            const saved = await Leave.create({
                employee: req.user.id,
                leaveType,
                leaveFinId: leaveFinId ?? null,
                payType: payType || 'Paid',
                fromDate,
                toDate,
                totalDays,
                reason
            });
            return res.status(201).json({
                message: 'Leave saved as draft (not posted to BC).',
                leaves: [saved],
                bc: []
            });
        }

        const info = await EmployeeInfo.findOne({ user: req.user.id });
        const employeeCode = info?.employeeCode || null;

        // Look up live BC balance to decide if we need to split this leave.
        let availableBalance = totalDays;
        if (bcConfigured() && leaveFinId != null && employeeCode) {
            try {
                const result = await checkLeaveBalance(employeeCode, leaveFinId, toBcDate(fromDate));
                availableBalance = Number(result?.balance) || 0;
            } catch (_) { /* fall back to no-split */ }
        }

        // Split rule:
        //   balance = 0           → one segment, Paid
        //   totalDays ≤ balance   → one segment, Unpaid
        //   totalDays > balance   → split: first `balance` days Unpaid, overflow days Paid
        const segments = [];
        if (availableBalance <= 0) {
            segments.push({ payType: 'Paid', fromDate: new Date(fromDate), toDate: new Date(toDate), totalDays });
        } else if (totalDays <= availableBalance) {
            segments.push({ payType: 'Unpaid', fromDate: new Date(fromDate), toDate: new Date(toDate), totalDays });
        } else {
            const unpaidDays = availableBalance;
            const paidDays = totalDays - unpaidDays;
            const unpaidFrom = new Date(fromDate);
            const unpaidTo = new Date(fromDate);
            unpaidTo.setDate(unpaidTo.getDate() + unpaidDays - 1);
            const paidFrom = new Date(fromDate);
            paidFrom.setDate(paidFrom.getDate() + unpaidDays);
            segments.push({ payType: 'Unpaid', fromDate: unpaidFrom, toDate: unpaidTo, totalDays: unpaidDays });
            segments.push({ payType: 'Paid', fromDate: paidFrom, toDate: new Date(toDate), totalDays: paidDays });
        }

        // BC auto-generates its own leaveReferenceNumber.
        // We create the MongoDB row first (no ref yet), POST to BC, then save BC's ref back.
        const leaves = [];
        const bc = [];
        for (const seg of segments) {
            const created = await Leave.create({
                employee: req.user.id,
                leaveType,
                leaveFinId: leaveFinId ?? null,
                payType: seg.payType,
                fromDate: seg.fromDate,
                toDate: seg.toDate,
                totalDays: seg.totalDays,
                reason: segments.length > 1 ? `${reason} (${seg.payType} part)` : reason
            });

            let bcAttempted = false;
            let bcOk = false;
            if (bcConfigured() && leaveFinId != null && employeeCode) {
                bcAttempted = true;
                try {
                    const result = await createEmployeeLeave({
                        employeeNumber: employeeCode,
                        payCode: leaveFinId,
                        leaveStartDate: toBcDate(seg.fromDate),
                        leaveEndDate: toBcDate(seg.toDate),
                        payType: toBcPayType(seg.payType)
                        // Don't send leaveReferenceNumber — BC generates it.
                    });
                    // Capture BC's generated reference and store on our row.
                    const bcRef = result?.leaveReferenceNumber || result?.LeaveReferenceNumber || null;
                    if (bcRef) created.leaveReferenceNumber = bcRef;
                    bcOk = true;
                    bc.push({ ok: true, payType: seg.payType, days: seg.totalDays, leaveReferenceNumber: bcRef, result });
                } catch (e) {
                    bc.push({ ok: false, payType: seg.payType, days: seg.totalDays, error: e.message });
                }
            }
            // Posting marks the leave as Posted (Draft → Posted). If a BC sync was
            // attempted but failed, keep it as a draft so it can be retried;
            // otherwise (BC not configured / no pay code) post it locally.
            created.isPosted = bcAttempted ? bcOk : true;
            await created.save();
            leaves.push(created);
        }

        const refs = leaves.map((l) => l.leaveReferenceNumber).filter(Boolean);
        const message = segments.length > 1
            ? `Leave split: ${segments[0].totalDays} day(s) Unpaid + ${segments[1].totalDays} day(s) Paid${refs.length ? ` (BC refs: ${refs.join(', ')})` : ''}.`
            : `Leave application submitted${refs.length ? ` (BC ref: ${refs[0]})` : ''}.`;

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
        const leaves = await Leave.find({ employee: req.user.id })
            .populate('employee', 'name email')
            .sort({ createdAt: -1 });
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
        if (leave.isPosted) {
            return res.status(400).json({ message: 'Cannot edit a leave that has already been posted to Business Central.' });
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

exports.deleteMyLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave not found' });
        if (String(leave.employee) !== String(req.user.id)) {
            return res.status(403).json({ message: 'You can only delete your own leaves' });
        }
        if (leave.isPosted) {
            return res.status(400).json({ message: 'Cannot delete a leave that has been posted to Business Central.' });
        }
        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot delete a ${leave.status.toLowerCase()} leave` });
        }
        await leave.deleteOne();
        res.json({ message: 'Leave deleted' });
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

const applyApproval = (leave, { status, approverRemarks, approverId, approverName }) => {
    leave.status = status;
    leave.approverRemarks = approverRemarks || '';
    leave.approvedBy = approverId || null;
    leave.approvedByName = approverName || '';
    leave.approvedAt = new Date();
    leave.isApproved = status === 'Approved';
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

        const approver = await User.findById(req.user.id).select('name');
        applyApproval(leave, { status, approverRemarks, approverId: req.user.id, approverName: approver?.name || '' });
        await leave.save();

        res.json({ message: `Leave ${status.toLowerCase()}`, leave });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// PATCH /api/leaves/by-ref/:refNumber/status — update all leaves sharing a BC reference number.
// Body can supply isApproved (bool), approvedByName, approvedAt, status, approverRemarks.
// If status not supplied: derived from isApproved (true→Approved, false→Rejected).
exports.updateLeaveStatusByRef = async (req, res) => {
    try {
        const { refNumber } = req.params;
        const { isApproved, approvedByName, approvedAt, status: bodyStatus, approverRemarks } = req.body;

        if (!refNumber) return res.status(400).json({ message: 'refNumber is required' });

        // Derive status from boolean isApproved if status not explicitly sent.
        const status = bodyStatus || (isApproved === true ? 'Approved' : isApproved === false ? 'Rejected' : null);
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'status must be Approved or Rejected (or send isApproved: true/false)' });
        }

        const matches = await Leave.find({ leaveReferenceNumber: refNumber });
        if (matches.length === 0) {
            return res.status(404).json({ message: `No leaves found with reference number ${refNumber}` });
        }

        // Look up approver name from User unless caller explicitly provided one.
        let approverName = approvedByName;
        if (!approverName) {
            const approver = await User.findById(req.user.id).select('name');
            approverName = approver?.name || '';
        }
        const stamp = approvedAt ? new Date(approvedAt) : new Date();

        const updated = [];
        for (const leave of matches) {
            leave.status = status;
            leave.isApproved = status === 'Approved';
            leave.approverRemarks = approverRemarks || '';
            leave.approvedBy = req.user.id;
            leave.approvedByName = approverName;
            leave.approvedAt = stamp;
            await leave.save();
            updated.push(leave);
        }
        res.json({
            message: `${updated.length} leave(s) ${status.toLowerCase()} for ref ${refNumber}`,
            refNumber,
            isApproved: status === 'Approved',
            approvedByName: approverName,
            approvedAt: stamp,
            leaves: updated
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
