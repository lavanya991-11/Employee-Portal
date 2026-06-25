const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const EmployeeInfo = require('../models/employeeInfo');
const Leave = require('../models/leave');
const Loan = require('../models/loan');
const Asset = require('../models/asset');
const Overtime = require('../models/overtime');
const Expense = require('../models/expense');
const TravelRequest = require('../models/travelRequest');
const LoanRequest = require('../models/loanRequest');
const FinElement = require('../models/finElement');
const Calendar = require('../models/calendar');
const CalendarPeriod = require('../models/calendarPeriod');
const LoanProduct = require('../models/loanProduct');

exports.listAll = async (req, res) => {
    try {
        const users = await User.find().select('-password -refreshToken').sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.adminStats = async (req, res) => {
    try {
        const [users, employees, leaves, loans, assets, overtimes, expenses, travels, loanRequests, finElements, calendars, calendarPeriods, loanProducts] = await Promise.all([
            User.countDocuments(),
            EmployeeInfo.countDocuments(),
            Leave.countDocuments(),
            Loan.countDocuments(),
            Asset.countDocuments(),
            Overtime.countDocuments(),
            Expense.countDocuments(),
            TravelRequest.countDocuments(),
            LoanRequest.countDocuments(),
            FinElement.countDocuments(),
            Calendar.countDocuments(),
            CalendarPeriod.countDocuments(),
            LoanProduct.countDocuments()
        ]);
        const [pendingLeaves, pendingLoans, pendingExpenses, pendingAssets, pendingOvertimes, pendingTravels, pendingLoanRequests] = await Promise.all([
            Leave.countDocuments({ status: 'Pending' }),
            Loan.countDocuments({ status: 'Pending' }),
            Expense.countDocuments({ status: 'Pending' }),
            Asset.countDocuments({ status: 'Pending' }),
            Overtime.countDocuments({ status: 'Pending' }),
            TravelRequest.countDocuments({ status: { $regex: 'pending', $options: 'i' } }),
            LoanRequest.countDocuments({ status: { $regex: 'pending', $options: 'i' } })
        ]);
        res.json({
            success: true,
            totals: { users, employees, leaves, loans, assets, overtimes, expenses, travels, loanRequests, finElements, calendars, calendarPeriods, loanProducts, credentials: users },
            pending: { leaves: pendingLeaves, loans: pendingLoans, expenses: pendingExpenses, assets: pendingAssets, overtimes: pendingOvertimes, travels: pendingTravels, loanRequests: pendingLoanRequests }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully",
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: "Login successful",
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
