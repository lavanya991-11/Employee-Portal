const mongoose = require('mongoose');

// Mirror of the BC "Identification Type" master, refreshed by the Scan action.
// identificationTypeCode is BC's unique key for an identification type.
const identificationTypeSchema = new mongoose.Schema({
    identificationTypeCode: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    identificationType: { type: String, default: '' },
    identificationTypeValue: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('IdentificationType', identificationTypeSchema);
