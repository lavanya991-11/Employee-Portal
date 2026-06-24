const mongoose = require('mongoose');

// App-wide company settings (single shared document) so the logo/name show
// for every user, not just the admin who set them.
const settingSchema = new mongoose.Schema({
    companyName: { type: String, default: '' },
    companyLogo: { type: String, default: '' } // /api/images/<id>
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
