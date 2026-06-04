const Loan = require('../models/loan');

exports.applyLoan = async (req, res) => {
    try {
        const { loanType, amount, reason } = req.body;

        const loan = await Loan.create({
            employee: req.user.id,
            loanType,
            amount,
            reason
        });

        res.status(201).json({
            message: "Loan application submitted",
            loan
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getMyLoans = async (req, res) => {
    try {
        const loans = await Loan.find({ employee: req.user.id }).sort({ createdAt: -1 });
        res.json({ count: loans.length, loans });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getAllLoans = async (req, res) => {
    try {
        const loans = await Loan.find()
            .populate('employee', 'name email')
            .sort({ createdAt: -1 });
        res.json({ count: loans.length, loans });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.updateLoanStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approverRemarks } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Status must be Approved or Rejected" });
        }

        const loan = await Loan.findById(id);
        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }

        loan.status = status;
        loan.approverRemarks = approverRemarks || '';
        loan.approvedBy = req.user.id;
        await loan.save();

        res.json({ message: `Loan ${status.toLowerCase()}`, loan });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
