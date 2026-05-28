const EmployeeInfo = require('../models/employeeInfo');

exports.getMyInfo = async (req, res) => {
    try {
        const info = await EmployeeInfo.findOne({ user: req.user.id });
        res.json({ success: true, employeeInfo: info || null });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

exports.saveMyInfo = async (req, res) => {
    try {
        const data = { ...req.body };
        delete data.user;
        delete data._id;

        const existing = await EmployeeInfo.findOne({ user: req.user.id });

        if (existing) {
            Object.assign(existing, data);
            await existing.save();
            return res.json({
                success: true,
                message: "Employee information updated",
                employeeInfo: existing
            });
        }

        if (!data.employeeCode) {
            return res.status(400).json({ success: false, message: "Employee Code is required" });
        }

        const codeExists = await EmployeeInfo.findOne({ employeeCode: data.employeeCode });
        if (codeExists) {
            return res.status(400).json({ success: false, message: "Employee Code already in use" });
        }

        const created = await EmployeeInfo.create({ ...data, user: req.user.id });
        res.status(201).json({
            success: true,
            message: "Employee information created",
            employeeInfo: created
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

exports.getAllInfo = async (req, res) => {
    try {
        const list = await EmployeeInfo.find()
            .populate('user', 'name email role')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: list.length, employees: list });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
