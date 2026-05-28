const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expenseType: {
        type: String,
        enum: ['Travel', 'Non-Travel'],
        required: true
    },
    claimType: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    attachment: {
        type: String,
        default: ''
    },
    remarks: {
        type: String,
        default: ''
    },
    travelRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Travel',
        default: null
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
    }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
