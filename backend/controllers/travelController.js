const Travel = require('../models/travel');

exports.applyTravel = async (req, res) => {
    try {
        const {
            travelType,
            purpose,
            fromDate,
            toDate,
            modeOfTravel,
            fromLocation,
            toLocation,
            estimatedCost
        } = req.body;

        if (new Date(toDate) < new Date(fromDate)) {
            return res.status(400).json({ message: "toDate cannot be before fromDate" });
        }

        const travel = await Travel.create({
            employee: req.user.id,
            travelType,
            purpose,
            fromDate,
            toDate,
            modeOfTravel,
            fromLocation,
            toLocation,
            estimatedCost
        });

        res.status(201).json({
            message: "Travel request submitted",
            travel
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getMyTravels = async (req, res) => {
    try {
        const travels = await Travel.find({ employee: req.user.id }).sort({ createdAt: -1 });
        res.json({ count: travels.length, travels });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getAllTravels = async (req, res) => {
    try {
        const travels = await Travel.find()
            .populate('employee', 'name email')
            .sort({ createdAt: -1 });
        res.json({ count: travels.length, travels });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.updateTravelStatus = async (req, res) => {
    try {
        if (req.user.role !== 'super-admin') {
            return res.status(403).json({ message: "Only Super Admin can approve or reject requests." });
        }
        const { id } = req.params;
        const { status, approverRemarks } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Status must be Approved or Rejected" });
        }

        const travel = await Travel.findById(id);
        if (!travel) {
            return res.status(404).json({ message: "Travel request not found" });
        }

        travel.status = status;
        travel.approverRemarks = approverRemarks || '';
        travel.approvedBy = req.user.id;
        await travel.save();

        res.json({ message: `Travel request ${status.toLowerCase()}`, travel });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
