const { defineModel } = require('./_sql');
module.exports = defineModel({
    name: 'Leave', table: 'Leaves',
    refs: { employee: { col: 'employeeId', ref: 'Users' }, approvedBy: { col: 'approvedById', ref: 'Users' } }
});
