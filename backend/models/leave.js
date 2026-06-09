const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leaveType: {
        type: String,
        required: true
    },
    leaveFinId: {
        type: Number,
        default: null
    },
    leaveReferenceNumber: {
        type: String,
        default: ''
    },
    payType: {
        type: String,
        enum: ['Paid', 'Unpaid', 'Half Paid'],
        default: 'Paid'
    },
    fromDate: {
        type: Date,
        required: true
    },
    toDate: {
        type: Date,
        required: true
    },
    totalDays: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    approverRemarks: {
        type: String,
        default: ''
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approvedByName: {
        type: String,
        default: ''
    },
    approvedAt: {
        type: Date,
        default: null
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isPosted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
