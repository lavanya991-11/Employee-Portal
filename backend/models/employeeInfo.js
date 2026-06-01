const mongoose = require('mongoose');

const employeeInfoSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeCode: { type: String, required: true, unique: true },

    firstName: { type: String, default: '' },
    middleName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    initials: { type: String, default: '' },
    arabicFirstName: { type: String, default: '' },
    arabicMiddleName: { type: String, default: '' },
    arabicLastName: { type: String, default: '' },
    searchName: { type: String, default: '' },

    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
    jobTitle: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive', 'Suspended', ''], default: 'Active' },

    creditCard: { type: String, default: '' },
    motherName: { type: String, default: '' },
    faith: { type: String, default: '' },
    education: { type: String, default: '' },
    emergencyContactNo: { type: String, default: '' },
    category: { type: String, default: '' },
    issueDate: { type: Date },
    expiryDate: { type: Date },

    department: { type: String, default: '' },
    designation: { type: String, default: '' },
    dateOfJoining: { type: Date },
    reportingManager: { type: String, default: '' },
    grade: { type: String, default: '' },
    employmentType: { type: String, default: '' },

    bankId: { type: String, default: '' },
    bankAccountNo: { type: String, default: '' },
    iban: { type: String, default: '' },
    branch: { type: String, default: '' },
    swiftCode: { type: String, default: '' },
    companyBank: { type: String, default: '' },

    currency: { type: String, default: 'AED' },
    annualBalanceCalculationCutoff: { type: Date },
    leaveBalance: { type: Number, default: 0 },
    jobNumber: { type: String, default: '' },

    employeeUserMapping: { type: String, default: '' },
    resourceNo: { type: String, default: '' },

    administration: {
        employmentType: {
            type: String,
            enum: ['Employee', 'Contract', 'Consultant', 'Trainee', 'Intern', ''],
            default: 'Employee'
        },
        birthDate: { type: Date },
        probationDate: { type: Date },
        probationInMonths: { type: Number, default: 0 },
        employmentDate: { type: Date },
        seniorityDate: { type: Date },
        terminationDate: { type: Date },
        noticePeriodInMonths: { type: Number, default: 0 },
        religion: { type: String, default: '' },
        maritalStatus: {
            type: String,
            enum: ['Single', 'Married', 'Divorced', 'Widowed', ''],
            default: ''
        },
        sponsor: { type: String, default: '' },
        nationality: { type: String, default: '' },
        nationalityName: { type: String, default: '' },
        location: { type: String, default: '' },
        language: { type: String, default: 'ENG' },
        languageName: { type: String, default: 'ENGLISH' },
        address: { type: String, default: '' },
        address2: { type: String, default: '' },
        city: { type: String, default: '' },
        county: { type: String, default: '' },
        altAddressCode: { type: String, default: '' },
        altAddressStartDate: { type: Date },
        altAddressEndDate: { type: Date },
        email: { type: String, default: '' },
        oldEmployeeCode: { type: String, default: '' }
    }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeInfo', employeeInfoSchema);
