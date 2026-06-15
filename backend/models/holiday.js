const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

holidaySchema.index({ fromDate: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
