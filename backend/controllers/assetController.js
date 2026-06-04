const Asset = require('../models/asset');

exports.applyAsset = async (req, res) => {
    try {
        const { assetCode, assetName, remarks } = req.body;

        const asset = await Asset.create({
            employee: req.user.id,
            assetCode,
            assetName,
            remarks
        });

        res.status(201).json({
            message: "Asset request submitted",
            asset
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getMyAssets = async (req, res) => {
    try {
        const assets = await Asset.find({ employee: req.user.id }).sort({ createdAt: -1 });
        res.json({ count: assets.length, assets });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getAllAssets = async (req, res) => {
    try {
        const assets = await Asset.find()
            .populate('employee', 'name email')
            .sort({ createdAt: -1 });
        res.json({ count: assets.length, assets });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.updateAssetStatus = async (req, res) => {
    try {
        if (req.user.role !== 'super-admin') {
            return res.status(403).json({ message: "Only Super Admin can approve or reject requests." });
        }
        const { id } = req.params;
        const { status, approverRemarks } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Status must be Approved or Rejected" });
        }

        const asset = await Asset.findById(id);
        if (!asset) {
            return res.status(404).json({ message: "Asset request not found" });
        }

        asset.status = status;
        asset.approverRemarks = approverRemarks || '';
        asset.approvedBy = req.user.id;
        await asset.save();

        res.json({ message: `Asset request ${status.toLowerCase()}`, asset });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
