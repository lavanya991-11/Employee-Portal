const FinElement = require('../models/finElement');
const { getAllFinMasters, bcConfigured } = require('../services/bcClient');

// Field list comes from the SQL table columns (cached after first use).
let MODEL_FIELDS = null;
const modelFields = async () => {
    if (!MODEL_FIELDS) MODEL_FIELDS = await FinElement.fieldNames();
    return MODEL_FIELDS;
};

const mapBcToModel = async (bc) => {
    const out = {};
    for (const k of await modelFields()) {
        const v = bc[k];
        if (v === undefined || v === null) continue;
        out[k] = v;
    }
    if (bc.systemId) out.bcSystemId = bc.systemId;
    if (bc.systemCreatedAt && bc.systemCreatedAt !== '0001-01-01T00:00:00Z') out.bcSystemCreatedAt = bc.systemCreatedAt;
    if (bc.systemCreatedBy) out.bcSystemCreatedBy = bc.systemCreatedBy;
    if (bc.systemModifiedAt && bc.systemModifiedAt !== '0001-01-01T00:00:00Z') out.bcSystemModifiedAt = bc.systemModifiedAt;
    if (bc.systemModifiedBy) out.bcSystemModifiedBy = bc.systemModifiedBy;
    return out;
};

exports.list = async (req, res) => {
    try {
        const { finType, isDisabled } = req.query;
        const filter = {};
        if (finType) filter.finType = finType;
        if (isDisabled === 'true') filter.isDisabled = true;
        if (isDisabled === 'false') filter.isDisabled = false;
        const items = await FinElement.find(filter).sort({ finId: 1 });
        res.json({ success: true, count: items.length, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const item = await FinElement.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, item });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const data = { ...req.body };
        delete data._id;
        if (data.finId == null) return res.status(400).json({ success: false, message: 'finId is required' });
        if (!data.finType) return res.status(400).json({ success: false, message: 'finType is required' });
        const exists = await FinElement.findOne({ finId: data.finId });
        if (exists) return res.status(400).json({ success: false, message: 'finId already in use' });
        const created = await FinElement.create(data);
        res.status(201).json({ success: true, message: 'FIN element created', item: created });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const item = await FinElement.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        const data = { ...req.body };
        delete data._id;
        delete data.finId; // finId is the unique key; don't allow changing it once created
        Object.assign(item, data);
        await item.save();
        res.json({ success: true, message: 'FIN element updated', item });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.scanFromBc = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }
        const rows = await getAllFinMasters();
        let upserted = 0;
        let skipped = 0;
        const errors = [];
        for (const row of rows) {
            if (row.finId == null) { skipped++; if (errors.length < 5) errors.push({ finId: null, reason: 'missing finId' }); continue; }
            const payload = await mapBcToModel(row);
            try {
                await FinElement.findOneAndUpdate(
                    { finId: row.finId },
                    { $set: payload },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                upserted++;
            } catch (e) {
                skipped++;
                if (errors.length < 5) errors.push({ finId: row.finId, reason: e.message });
            }
        }
        res.json({ success: true, message: `Imported ${upserted} FIN element(s) from BC (${skipped} skipped).`, fetched: rows.length, upserted, skipped, errors });
    } catch (err) {
        res.status(500).json({ success: false, message: 'BC scan failed', error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const item = await FinElement.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'FIN element deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
