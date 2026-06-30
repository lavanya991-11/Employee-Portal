const Setting = require('../models/setting');

// Single shared settings document.
const getOrCreate = async () => {
    let s = await Setting.findOne();
    if (!s) s = await Setting.create({});
    return s;
};

// GET /api/settings — read company settings (any authenticated user).
exports.get = async (req, res) => {
    try {
        const s = await getOrCreate();
        res.json({ success: true, settings: { companyName: s.companyName, companyLogo: s.companyLogo, backgroundColor: s.backgroundColor, fieldFontColor: s.fieldFontColor } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// PUT /api/settings — update company settings (admin only).
exports.update = async (req, res) => {
    try {
        const s = await getOrCreate();
        const { companyName, companyLogo, backgroundColor, fieldFontColor } = req.body;
        if (companyName !== undefined) s.companyName = companyName;
        if (companyLogo !== undefined) s.companyLogo = companyLogo;
        if (backgroundColor !== undefined) s.backgroundColor = backgroundColor;
        if (fieldFontColor !== undefined) s.fieldFontColor = fieldFontColor;
        await s.save();
        res.json({ success: true, message: 'Settings updated', settings: { companyName: s.companyName, companyLogo: s.companyLogo, backgroundColor: s.backgroundColor, fieldFontColor: s.fieldFontColor } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
