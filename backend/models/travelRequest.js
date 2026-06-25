const mongoose = require('mongoose');

// A travel/earning request submitted through the portal to BC's
// SubmitEarningRequest action. requestNo + status + totalAmount come back from
// BC; documentNo is our local auto number.
const travelLineSchema = new mongoose.Schema({
    earningPayCode: { type: Number, default: 0 },
    earningPayCodeDesc: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    unitCount: { type: Number, default: 1 },
    earningDate: { type: String, default: '' }
}, { _id: false });

const travelAttachmentSchema = new mongoose.Schema({
    fileName: { type: String, default: '' },
    mimeType: { type: String, default: '' }
}, { _id: false });

const travelRequestSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentNo: { type: String, default: '' },
    transactionNo: { type: String, default: '', maxlength: 20 },
    employeeCode: { type: String, default: '' },
    comments: { type: String, default: '' },
    lines: { type: [travelLineSchema], default: [] },
    attachments: { type: [travelAttachmentSchema], default: [] },
    totalAmount: { type: Number, default: 0 },
    requestNo: { type: String, default: '' },
    status: { type: String, default: '' },
    approvedBy: { type: String, default: '' },
    approvedDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('TravelRequest', travelRequestSchema);
