// Data Management — destructive operations restricted to super-admin.
// Only the project's known Mongoose models are exposed; raw MongoDB collections are NOT touched.

const User = require('../models/user');
const EmployeeInfo = require('../models/employeeInfo');
const Leave = require('../models/leave');
const Loan = require('../models/loan');
const Asset = require('../models/asset');
const Overtime = require('../models/overtime');
const Travel = require('../models/travel');
const Expense = require('../models/expense');
const FinElement = require('../models/finElement');
const ImageRegister = require('../models/imageRegister');

// Each entry pairs a logical name with its Mongoose model. Order matters for dependencies.
const TABLES = [
    { key: 'expenses', label: 'expenses', model: Expense },
    { key: 'travels', label: 'travels', model: Travel },
    { key: 'overtimes', label: 'overtimes', model: Overtime },
    { key: 'assets', label: 'assets', model: Asset },
    { key: 'loans', label: 'loans', model: Loan },
    { key: 'leaves', label: 'leaves', model: Leave },
    { key: 'finElements', label: 'fin_elements', model: FinElement },
    { key: 'images', label: 'image_registers', model: ImageRegister },
    { key: 'employeeInfos', label: 'employee_infos', model: EmployeeInfo },
    { key: 'users', label: 'users', model: User }
];

const requireSuperAdmin = (req, res) => {
    if (req.user.role !== 'super-admin') {
        res.status(403).json({ success: false, message: 'Only Super Admin can access Data Management.' });
        return false;
    }
    return true;
};

exports.listTables = async (req, res) => {
    try {
        if (!requireSuperAdmin(req, res)) return;
        const tables = await Promise.all(TABLES.map(async (t) => ({
            key: t.key,
            label: t.label,
            count: await t.model.countDocuments()
        })));
        res.json({ success: true, count: tables.length, tables });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.deleteOne = async (req, res) => {
    try {
        if (!requireSuperAdmin(req, res)) return;
        const t = TABLES.find((x) => x.key === req.params.key || x.label === req.params.key);
        if (!t) return res.status(404).json({ success: false, message: `Unknown table: ${req.params.key}` });
        const result = await t.model.deleteMany({});
        res.json({ success: true, message: `Deleted ${result.deletedCount} document(s) from ${t.label}.`, deleted: result.deletedCount });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.deleteSelected = async (req, res) => {
    try {
        if (!requireSuperAdmin(req, res)) return;
        const keys = Array.isArray(req.body.keys) ? req.body.keys : [];
        const summary = [];
        for (const key of keys) {
            const t = TABLES.find((x) => x.key === key || x.label === key);
            if (!t) { summary.push({ key, ok: false, error: 'Unknown table' }); continue; }
            try {
                const result = await t.model.deleteMany({});
                summary.push({ key: t.key, ok: true, deleted: result.deletedCount });
            } catch (e) {
                summary.push({ key: t.key, ok: false, error: e.message });
            }
        }
        const totalDeleted = summary.reduce((s, x) => s + (x.deleted || 0), 0);
        res.json({ success: true, message: `Cleared ${summary.filter((x) => x.ok).length} table(s) — ${totalDeleted} document(s) removed.`, summary });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.deleteAll = async (req, res) => {
    try {
        if (!requireSuperAdmin(req, res)) return;
        const summary = [];
        for (const t of TABLES) {
            try {
                const result = await t.model.deleteMany({});
                summary.push({ key: t.key, ok: true, deleted: result.deletedCount });
            } catch (e) {
                summary.push({ key: t.key, ok: false, error: e.message });
            }
        }
        const totalDeleted = summary.reduce((s, x) => s + (x.deleted || 0), 0);
        res.json({ success: true, message: `Cleared ${TABLES.length} tables — ${totalDeleted} document(s) removed.`, summary });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
