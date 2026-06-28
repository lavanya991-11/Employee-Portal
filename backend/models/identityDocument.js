const mongoose = require('mongoose');

// Mirror of the BC "Identity Documents" card (Visa / Passport / Residence) per
// employee, refreshed by the Scan action. Keyed by employeeCode.
//
// Dates are stored as plain strings so they display exactly as BC returns them
// (BC sends date-only strings; storing as Date risks timezone shifts).
const identityDocumentSchema = new mongoose.Schema({
    employeeCode: { type: String, required: true, unique: true, index: true },
    employeeName: { type: String, default: '' },

    // Visa Details
    primaryVisaNumber: { type: String, default: '' },
    visaNumber: { type: String, default: '' },
    visaType: { type: String, default: '' },
    designation: { type: String, default: '' },
    visaIssueFrom: { type: String, default: '' },
    visaIssueDate: { type: String, default: '' },
    visaExpiryDate: { type: String, default: '' },

    // Passport Details
    primaryPassportNumber: { type: String, default: '' },
    passportNumber: { type: String, default: '' },
    passportIssueFrom: { type: String, default: '' },
    passportName: { type: String, default: '' },
    passportIssueDate: { type: String, default: '' },
    passportExpiryDate: { type: String, default: '' },

    // Residence Details
    primaryResidencyId: { type: String, default: '' },
    civilId: { type: String, default: '' },
    residenceNumber: { type: String, default: '' },
    residenceIssueDate: { type: String, default: '' },
    residenceExpiryDate: { type: String, default: '' },
    permitStatus: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('IdentityDocument', identityDocumentSchema);
