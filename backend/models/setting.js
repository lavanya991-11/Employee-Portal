const mongoose = require('mongoose');

// App-wide settings (single shared document) so the company logo persists
// server-side and survives logout / other devices.
const settingSchema = new mongoose.Schema({
    companyName: { type: String, default: '' },
    companyLogo: { type: String, default: '' }, // /api/images/<id>
    backgroundColor: { type: String, default: '' }, // app background color (hex); empty = default
    fieldFontColor: { type: String, default: '' }, // input field font color (hex); empty = default
    fieldCaptionColor: { type: String, default: '' } // field caption/label font color (hex); empty = default
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
