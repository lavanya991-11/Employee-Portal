const LoanProduct = require('../models/loanProduct');
const { getLoanProducts, bcConfigured } = require('../services/bcClient');

const mapBcToModel = (bc) => ({
    finId: Number(bc.finId),
    description: bc.description || '',
    frequency: bc.frequency || '',
    maximumInstallmentPeriod: Number(bc.maximumInstallmentPeriod) || 0
});

// GET /api/loan-products — list the locally stored loan products.
exports.list = async (req, res) => {
    try {
        const items = await LoanProduct.find().sort({ finId: 1 });
        res.json({ success: true, count: items.length, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// POST /api/loan-products/sync — fetch from BC, wipe the table, insert the latest.
// The fetch happens before the delete so a failed call leaves existing data intact.
exports.sync = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }

        const rows = await getLoanProducts();
        const docs = rows.filter((r) => r && r.finId != null).map(mapBcToModel);

        const deleted = await LoanProduct.deleteMany({});
        let inserted = [];
        if (docs.length > 0) {
            inserted = await LoanProduct.insertMany(docs, { ordered: false });
        }

        res.json({
            success: true,
            message: `Synced loan products from BC — removed ${deleted.deletedCount}, imported ${inserted.length}.`,
            fetched: rows.length,
            deleted: deleted.deletedCount,
            inserted: inserted.length
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Loan products sync failed', error: err.message });
    }
};

// DELETE /api/loan-products/all — remove every loan product record.
exports.removeAll = async (req, res) => {
    try {
        const result = await LoanProduct.deleteMany({});
        res.json({ success: true, message: `Deleted ${result.deletedCount} loan product(s).`, deleted: result.deletedCount });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// DELETE /api/loan-products/:id — remove a single loan product record.
exports.remove = async (req, res) => {
    try {
        const item = await LoanProduct.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Loan product deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
