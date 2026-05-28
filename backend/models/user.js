const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    empId: { type: String, unique: true, sparse: true },

    department: { type: String, default: '' },
    designation: { type: String, default: '' },
    dateOfJoining: { type: Date },

    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zip: { type: String, default: '' },
        country: { type: String, default: '' }
    },
    contactNumber: { type: String, default: '' },
    emergencyContact: {
        name: { type: String, default: '' },
        relationship: { type: String, default: '' },
        phone: { type: String, default: '' }
    },
    bankDetails: {
        bankName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        ifsc: { type: String, default: '' },
        branch: { type: String, default: '' }
    },
    profilePicture: { type: String, default: '' },

    businessEntity: { type: String, default: '' },
    employeeType: { type: String, default: '' },
    dateOfBirth: { type: Date },
    confirmationDate: { type: Date },
    grade: { type: String, default: '' },
    service: { type: String, default: '' },
    nextShift: { type: String, default: '' },
    reportingManager: { type: String, default: '' },

    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    role: {
        type: String,
        enum: ['employee', 'manager', 'admin', 'super-admin'],
        default: 'employee'
    },
    refreshToken: { type: String, default: null },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
