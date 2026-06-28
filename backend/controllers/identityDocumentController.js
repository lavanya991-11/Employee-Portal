const IdentityDocument = require('../models/identityDocument');
const { getIdentityDocuments, bcConfigured } = require('../services/bcClient');

// Map a BC identity-document row onto the Mongoose model.
//
// IMPORTANT: the source keys below are assumed from BC's standard camelCase
// naming for the "Identity Documents" card. If a Scan imports rows with blank
// columns, adjust the right-hand side of each line to match the actual JSON
// property names returned by the web service.
const mapBcToModel = (bc) => ({
    employeeCode: bc.employeeCode,
    employeeName: bc.employeeName || bc.fullName || '',

    primaryVisaNumber: bc.primaryVisaNumber || '',
    visaNumber: bc.visaNumber || '',
    visaType: bc.visaType || '',
    designation: bc.designation || '',
    visaIssueFrom: bc.visaIssueFrom || '',
    visaIssueDate: bc.visaIssueDate || '',
    visaExpiryDate: bc.visaExpiryDate || '',

    primaryPassportNumber: bc.primaryPassportNumber || '',
    passportNumber: bc.passportNumber || '',
    passportIssueFrom: bc.passportIssueFrom || '',
    passportName: bc.passportName || '',
    passportIssueDate: bc.passportIssueDate || '',
    passportExpiryDate: bc.passportExpiryDate || '',

    primaryResidencyId: bc.primaryResidencyId || '',
    civilId: bc.civilId || '',
    residenceNumber: bc.residenceNumber || '',
    residenceIssueDate: bc.residenceIssueDate || '',
    residenceExpiryDate: bc.residenceExpiryDate || '',
    permitStatus: bc.permitStatus || ''
});

// GET /api/identity-documents — list the locally stored records.
exports.list = async (req, res) => {
    try {
        const items = await IdentityDocument.find().sort({ employeeCode: 1 });
        res.json({ success: true, count: items.length, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// POST /api/identity-documents/scan — refresh from BC:
//   1. call the BC OData web service and retrieve the latest identity documents
//   2. delete all existing records
//   3. insert the freshly retrieved records
// The fetch happens before the delete so a failed call leaves existing data intact.
exports.scan = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }

        const rows = await getIdentityDocuments();
        const docs = rows
            .filter((r) => r && r.employeeCode)
            .map(mapBcToModel);

        const deleted = await IdentityDocument.deleteMany({});
        let inserted = [];
        if (docs.length > 0) {
            inserted = await IdentityDocument.insertMany(docs, { ordered: false });
        }

        res.json({
            success: true,
            message: `Scanned identity documents from BC — removed ${deleted.deletedCount}, inserted ${inserted.length}.`,
            fetched: rows.length,
            deleted: deleted.deletedCount,
            inserted: inserted.length
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Identity documents scan failed', error: err.message });
    }
};

// DELETE /api/identity-documents/all — remove every record.
exports.removeAll = async (req, res) => {
    try {
        const result = await IdentityDocument.deleteMany({});
        res.json({ success: true, message: `Deleted ${result.deletedCount} identity document(s).`, deleted: result.deletedCount });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// DELETE /api/identity-documents/:id — remove a single record.
exports.remove = async (req, res) => {
    try {
        const item = await IdentityDocument.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Identity document deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
