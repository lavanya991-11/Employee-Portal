const IdentificationType = require('../models/identificationType');
const { getIdentificationTypes, bcConfigured } = require('../services/bcClient');

// Map a BC identification-type row onto the Mongoose model, keeping only known fields.
const mapBcToModel = (bc) => ({
    identificationTypeCode: bc.identificationTypeCode,
    description: bc.description || '',
    identificationType: bc.identificationType || '',
    identificationTypeValue: Number(bc.identificationTypeValue) || 0
});

// GET /api/identification-types — list the locally stored records.
exports.list = async (req, res) => {
    try {
        const items = await IdentificationType.find().sort({ identificationTypeCode: 1 });
        res.json({ success: true, count: items.length, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// POST /api/identification-types/scan — refresh from BC:
//   1. call the BC OData web service and retrieve the latest identification types
//   2. delete all existing records
//   3. insert the freshly retrieved records
// The fetch happens before the delete so a failed call leaves existing data intact.
exports.scan = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }

        const rows = await getIdentificationTypes();
        const docs = rows
            .filter((r) => r && r.identificationTypeCode)
            .map(mapBcToModel);

        const deleted = await IdentificationType.deleteMany({});
        let inserted = [];
        if (docs.length > 0) {
            inserted = await IdentificationType.insertMany(docs, { ordered: false });
        }

        res.json({
            success: true,
            message: `Scanned identification types from BC — removed ${deleted.deletedCount}, inserted ${inserted.length}.`,
            fetched: rows.length,
            deleted: deleted.deletedCount,
            inserted: inserted.length
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Identification type scan failed', error: err.message });
    }
};

// DELETE /api/identification-types/all — remove every record.
exports.removeAll = async (req, res) => {
    try {
        const result = await IdentificationType.deleteMany({});
        res.json({ success: true, message: `Deleted ${result.deletedCount} identification type(s).`, deleted: result.deletedCount });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// DELETE /api/identification-types/:id — remove a single record.
exports.remove = async (req, res) => {
    try {
        const item = await IdentificationType.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Identification type deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
