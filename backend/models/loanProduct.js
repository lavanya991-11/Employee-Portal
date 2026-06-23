const mongoose = require('mongoose');

// Loan products mirrored from the BC NOVAPAY GetLoanProducts web service,
// refreshed by the Sync Loan Products action. Keyed on finId.
const loanProductSchema = new mongoose.Schema({
    finId: { type: Number, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    frequency: { type: String, default: '' },
    maximumInstallmentPeriod: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('LoanProduct', loanProductSchema);
