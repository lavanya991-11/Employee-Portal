const mongoose = require('mongoose');

const finElementSchema = new mongoose.Schema({
    // Identity
    finId: { type: Number, required: true, unique: true, index: true },
    description: { type: String, default: '', maxlength: 250 },
    description2: { type: String, default: '', maxlength: 250 },
    finIdShortName: { type: String, default: '', maxlength: 7 },

    // Classification
    repetition: {
        type: String,
        enum: ['OneTime', 'Periodic'],
        default: 'OneTime'
    },
    finType: {
        type: String,
        enum: ['Earning', 'Deduction', 'PaidLeave', 'OverTime', 'UnPaidLeave', 'EOS'],
        required: true
    },
    frequency: {
        type: String,
        enum: ['Monthly', 'Weekly', 'Quartely', 'Semiannual', 'Yearly', 'CalendarPeriods', 'Other'],
        default: 'Monthly'
    },

    // Flags
    isDisabled: { type: Boolean, default: false },
    restrictedWithGrade: { type: Boolean, default: false },
    postDirectlyToLedger: { type: Boolean, default: false },
    availableOnESS: { type: Boolean, default: false },
    isSystemReserved: { type: Boolean, default: false },

    // Equations
    isEquation: { type: Boolean, default: false },
    standardEquation: { type: String, default: '', maxlength: 250 },
    maxInstAmountEquation: { type: String, default: '', maxlength: 250 },
    partialEquation: { type: String, default: '', maxlength: 250 },
    publicHolidaysEquation: { type: String, default: '', maxlength: 250 },
    offDaysEquation: { type: String, default: '', maxlength: 250 },
    lateWorkingDaysEquation: { type: String, default: '', maxlength: 250 },

    // Leave configuration
    leavePeriodBased: {
        type: String,
        enum: ['CalenderYear', 'EmployeeYear'],
        default: 'CalenderYear'
    },
    leavePeriodReference: {
        type: String,
        enum: ['Year', 'Month', 'Day'],
        default: 'Year'
    },
    hourlyLeave: { type: Boolean, default: false },
    hourlyLeaveType: {
        type: String,
        enum: ['Period', 'Day'],
        default: 'Period'
    },
    cashLeave: { type: Boolean, default: false },
    esolMaxDaysPerYear: { type: Number, default: 0 },
    esolMaxConsecutiveDays: { type: Number, default: 0 },
    deductFromYearlyLeaveBal: { type: Boolean, default: false },
    parentLeaveBalance: { type: Number, default: 0 },
    permitPaidMoreActual: { type: Boolean, default: false },
    stopSalaryIfNotReturn: { type: Boolean, default: false },
    stopSalaryInLeaveMonth: { type: Boolean, default: false },
    extendToEMthInNoReturn: { type: Boolean, default: false },
    deductWeeklyVacation: { type: Boolean, default: false },
    officalHolidaysDeducted: { type: Boolean, default: false },
    deductRestDays: { type: Boolean, default: false },
    deductFromPayroll: { type: Boolean, default: false },
    prepraidSalary: { type: Boolean, default: false },
    completeVacationPayment: { type: Boolean, default: false },
    publicHolidayPaid: { type: Boolean, default: false },
    annualLeaveGenerateUnPaid: { type: Boolean, default: false },
    leaveSalaryAsLoan: { type: Boolean, default: false },
    minLeaveDaysForLeaveSal: { type: Boolean, default: false },
    accumulatedYears: { type: Number, default: 0 },
    consumedFromAnnual: { type: Boolean, default: false },
    fixedDeductBalance: { type: Boolean, default: false },
    fixedDaysDeducted: { type: Number, default: 0 },
    allowToAffectBalByMinus: { type: Boolean, default: false },
    publicAddedToBalance: { type: Boolean, default: false },
    offDaysAddedToBalance: { type: Boolean, default: false },
    restDayAddedToBalance: { type: Boolean, default: false },
    excludeLastOffDays: { type: Boolean, default: false },
    validLeaveReturn: { type: Boolean, default: false },
    returnToBalance: { type: Boolean, default: false },
    unPaidLeaveId: { type: Number, default: 0 },
    unPaidLeaveIdForEarly: { type: Number, default: 0 },

    // Exam leave
    examLeave: { type: Boolean, default: false },
    leaveDaysPriorExam: { type: Number, default: 0 },
    includeExamDayInLeaveDays: { type: Boolean, default: false },
    stopDaysAffectLeaveEq: { type: Boolean, default: false },

    // Experience
    deductedFromExperience: { type: Boolean, default: false },
    daysToAffectExp: { type: Number, default: 0 },

    // Payroll / payslip
    includeInGrossSalary: { type: Boolean, default: false },
    elementOfPayslip: { type: Boolean, default: false },
    payrollCategory: {
        type: String,
        enum: ['Standard', 'NonStandard'],
        default: 'Standard'
    },
    payTransactionType: {
        type: String,
        enum: ['None', 'PaidLeave', 'UnPaidLeave', 'OneTimeEarDedOT', 'MonthlyPayroll', 'EOS', 'LeaveProvision', 'OtherProvision', 'LeaveEncashment'],
        default: 'None'
    },
    isBasicSalary: { type: Boolean, default: false },

    // Expense / reimbursement
    isExpense: { type: Boolean, default: false },
    expenseSubLedger: {
        type: String,
        enum: ['Vendor', 'Ledger'],
        default: 'Ledger'
    },
    isReimbursement: { type: Boolean, default: false },
    reimbursementCode: { type: Number, default: 0 },
    isFlightTicket: { type: Boolean, default: false },
    isChildRequired: { type: Boolean, default: false },
    isPerdiem: { type: Boolean, default: false },
    isAttachmentRequired: { type: Boolean, default: false },
    isJobRelated: { type: Boolean, default: false },

    // Loan
    isLoan: { type: Boolean, default: false },
    maximumInstallmentPeriod: { type: Number, default: 0 },
    leaveSalaryLoanCode: { type: Number, default: 0 },

    // Deduction details
    relatedDeduction: { type: Number, default: 0 },
    deductionType: {
        type: String,
        enum: ['Others', 'SocialSecurity', 'Penalty'],
        default: 'Others'
    },
    socialSecurity: { type: Number, default: 0 },
    fixedAmount: { type: Number, default: 0 },
    siWillBeAddedToBasic: { type: Boolean, default: false },
    maximumTotSSecuritySalary: { type: Number, default: 0 },
    pensionCompanyContribution: { type: Number, default: 0 },

    // ESOL (End of Service)
    esolDeductFullAmtInMOJ: { type: Boolean, default: false },
    esolDeductFullAmtInLastM: { type: Boolean, default: false },
    esolCalculateOnProRata: { type: Boolean, default: false },
    eosPartialCalculate: { type: Boolean, default: false },
    eosPartialSlab: { type: Boolean, default: false },
    overideEosPerPeriod: { type: Boolean, default: false },
    paidNoticePeriod: { type: Boolean, default: false },
    minimumOfServiceMonth: { type: Number, default: 0 },
    minimumOfServiceYear: { type: Number, default: 0 },

    // Tax / Social Insurance
    usedInTaxCalc: { type: Boolean, default: false },
    usedInSocialCalc: { type: Boolean, default: false },
    isTaxDeduction: { type: Boolean, default: false },
    isSocialInsurance: { type: Boolean, default: false },
    includeInTaxSalaryCalc: { type: Boolean, default: false },
    excludeFromTaxSalaryCalc: { type: Boolean, default: false },
    taxCalculationAs: {
        type: String,
        enum: ['', 'Yearly', 'Monthly'],
        default: ''
    },

    // History / audit (employee transaction)
    postToEmployeeTransHist: { type: Boolean, default: false },
    transactionDescription: { type: String, default: '', maxlength: 250 },
    transactionDescription1: { type: String, default: '', maxlength: 250 },
    transactionDescription2: { type: String, default: '', maxlength: 250 },
    transactionDescription3: { type: String, default: '', maxlength: 250 },

    // Misc
    leaveCalcReference: { type: Number, default: 0 },
    unAuthorizedAbsense: { type: Boolean, default: false },
    isValidForEOSManualEntry: { type: Boolean, default: false },

    // BC sync fields
    bcSystemId: { type: String, default: '' },
    bcSystemCreatedAt: { type: Date },
    bcSystemCreatedBy: { type: String, default: '' },
    bcSystemModifiedAt: { type: Date },
    bcSystemModifiedBy: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('FinElement', finElementSchema);
