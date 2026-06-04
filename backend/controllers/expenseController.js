const Expense = require('../models/expense');

exports.applyExpense = async (req, res) => {
    try {
        const {
            expenseType,
            claimType,
            amount,
            attachment,
            remarks,
            travelRef
        } = req.body;

        if (!['Travel', 'Non-Travel'].includes(expenseType)) {
            return res.status(400).json({ message: "expenseType must be 'Travel' or 'Non-Travel'" });
        }

        const expense = await Expense.create({
            employee: req.user.id,
            expenseType,
            claimType,
            amount,
            attachment,
            remarks,
            travelRef: expenseType === 'Travel' ? travelRef : null
        });

        res.status(201).json({
            message: "Expense claim submitted",
            expense
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getMyExpenses = async (req, res) => {
    try {
        const { type } = req.query;
        const filter = { employee: req.user.id };
        if (type) filter.expenseType = type;

        const expenses = await Expense.find(filter).sort({ createdAt: -1 });
        res.json({ count: expenses.length, expenses });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getAllExpenses = async (req, res) => {
    try {
        const { type } = req.query;
        const filter = {};
        if (type) filter.expenseType = type;

        const expenses = await Expense.find(filter)
            .populate('employee', 'name email')
            .sort({ createdAt: -1 });
        res.json({ count: expenses.length, expenses });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.updateExpenseStatus = async (req, res) => {
    try {
        if (req.user.role !== 'super-admin') {
            return res.status(403).json({ message: "Only Super Admin can approve or reject requests." });
        }
        const { id } = req.params;
        const { status, approverRemarks } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Status must be Approved or Rejected" });
        }

        const expense = await Expense.findById(id);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        expense.status = status;
        expense.approverRemarks = approverRemarks || '';
        expense.approvedBy = req.user.id;
        await expense.save();

        res.json({ message: `Expense ${status.toLowerCase()}`, expense });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
