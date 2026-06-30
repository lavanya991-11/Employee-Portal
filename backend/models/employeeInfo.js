const { defineModel } = require('./_sql');

module.exports = defineModel({
    name: 'EmployeeInfo',
    table: 'EmployeeInfo',
    refs: { user: { col: 'userId', ref: 'Users' } },
    nested: {
        administration: {
            prefix: 'admin_',
            keys: ['employmentType', 'birthDate', 'probationDate', 'probationInMonths', 'employmentDate',
                'seniorityDate', 'terminationDate', 'noticePeriodInMonths', 'religion', 'maritalStatus',
                'sponsor', 'nationality', 'nationalityName', 'location', 'language', 'languageName',
                'address', 'address2', 'city', 'county', 'altAddressCode', 'altAddressStartDate',
                'altAddressEndDate', 'email', 'oldEmployeeCode']
        },
        identityDocuments: {
            prefix: 'idDoc_',
            keys: ['primaryVisaNumber', 'visaNumber', 'visaType', 'visaDesignation', 'visaIssueFrom',
                'visaIssueDate', 'visaExpiryDate', 'primaryPassportNumber', 'passportNumber',
                'passportIssueFrom', 'passportName', 'passportIssueDate', 'passportExpiryDate',
                'primaryResidencyId', 'civilId', 'residencyNumber', 'residencyIssueDate',
                'residencyExpiryDate', 'residencyPermitStatus']
        }
    }
});
