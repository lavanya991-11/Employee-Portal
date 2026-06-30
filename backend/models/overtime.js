const { defineModel } = require('./_sql');
module.exports = defineModel({
    name: 'Overtime', table: 'Overtimes',
    refs: { employee: { col: 'employeeId', ref: 'Users' }, approvedBy: { col: 'approvedById', ref: 'Users' } }
});
