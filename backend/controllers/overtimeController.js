const Overtime = require('../models/overtime');

exports.applyOvertime = async (req, res) => {
    try {
        const { date, hoursRequested, projectRef, justification } = req.body;

        const overtime = await Overtime.create({
            employee: req.user.id,
            date,
            hoursRequested,
            projectRef,
            justification
        });

        res.status(201).json({
            message: "Overtime request submitted",
            overtime
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getMyOvertimes = async (req, res) => {
    try {
        const overtimes = await Overtime.find({ employee: req.user.id }).sort({ createdAt: -1 });
        res.json({ count: overtimes.length, overtimes });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getAllOvertimes = async (req, res) => {
    try {
        const overtimes = await Overtime.find()
            .populate('employee', 'name email')
            .sort({ createdAt: -1 });
        res.json({ count: overtimes.length, overtimes });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.updateOvertimeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approverRemarks } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Status must be Approved or Rejected" });
        }

        const overtime = await Overtime.findById(id);
        if (!overtime) {
            return res.status(404).json({ message: "Overtime request not found" });
        }

        overtime.status = status;
        overtime.approverRemarks = approverRemarks || '';
        overtime.approvedBy = req.user.id;
        await overtime.save();

        res.json({ message: `Overtime ${status.toLowerCase()}`, overtime });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
