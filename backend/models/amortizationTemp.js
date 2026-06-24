const mongoose = require('mongoose');

// Temporary (inquiry-only) amortization rows, scoped per user and refreshed on
// every Amortization action. Populated from BC GetEmployeeInstallments.
const amortizationTempSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // request context / summary (same for every row of one fetch)
    employeeCode: { type: String, default: '' },
    transactionNo: { type: String, default: '' },
    finId: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },

    // installment fields
    serialNumber: { type: Number, default: 0 },
    payCodeDescription: { type: String, default: '' },
    dueDate: { type: Date },
    deductionDate: { type: Date },
    amount: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    isShifted: { type: Boolean, default: false },
    isDisabled: { type: Boolean, default: false },
    loanEncashmentNo: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('AmortizationTemp', amortizationTempSchema);
