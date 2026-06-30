const { defineModel } = require('./_sql');
module.exports = defineModel({
    name: 'Loan', table: 'Loans',
    refs: { employee: { col: 'employeeId', ref: 'Users' }, approvedBy: { col: 'approvedById', ref: 'Users' } }
});
