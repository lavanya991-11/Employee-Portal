// SQL Server-backed model (was Mongoose). Same require path & API.
const { defineModel } = require('./_sql');

module.exports = defineModel({
    name: 'User',
    table: 'Users',
    refs: { manager: { col: 'managerId', ref: 'Users' } },
    nested: {
        address: { prefix: 'address_', keys: ['street', 'city', 'state', 'zip', 'country'] },
        emergencyContact: { prefix: 'emergencyContact_', keys: ['name', 'relationship', 'phone'] },
        bankDetails: { prefix: 'bank_', keys: ['bankName', 'accountNumber', 'ifsc', 'branch'] }
    }
});
