const { defineModel } = require('./_sql');
module.exports = defineModel({
    name: 'AmortizationTemp', table: 'AmortizationTemp',
    refs: { employee: { col: 'employeeId', ref: 'Users' } }
});
