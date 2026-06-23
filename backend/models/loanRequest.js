const mongoose = require('mongoose');

// A loan request submitted through the portal to BC's SubmitLoanRequest action.
// requestNo + status come back from BC; documentNo is our local auto number.
const loanRequestSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentNo: { type: String, default: '' },
    employeeCode: { type: String, default: '' },
    loanPayCode: { type: Number, default: 0 },
    loanAmount: { type: Number, default: 0 },
    installmentCalculation: { type: Number, default: 0 },
    noOfInstallments: { type: Number, default: 0 },
    comments: { type: String, default: '' },
    requestNo: { type: String, default: '' },
    status: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('LoanRequest', loanRequestSchema);
