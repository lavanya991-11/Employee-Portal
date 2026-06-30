const { defineModel } = require('./_sql');
// approvedBy is a plain string column here (not a user ref).
module.exports = defineModel({
    name: 'LoanRequest', table: 'LoanRequests',
    refs: { employee: { col: 'employeeId', ref: 'Users' } }
});
