const FinElement = require('../models/finElement');

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

exports.remove = async (req, res) => {
    try {
        const item = await FinElement.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'FIN element deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
