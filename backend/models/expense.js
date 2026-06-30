const { defineModel } = require('./_sql');
module.exports = defineModel({
    name: 'Expense', table: 'Expenses',
    refs: { employee: { col: 'employeeId', ref: 'Users' }, approvedBy: { col: 'approvedById', ref: 'Users' } }
});
