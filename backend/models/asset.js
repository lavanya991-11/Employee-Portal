const { defineModel } = require('./_sql');
module.exports = defineModel({
    name: 'Asset', table: 'Assets',
    refs: { employee: { col: 'employeeId', ref: 'Users' }, approvedBy: { col: 'approvedById', ref: 'Users' } }
});
