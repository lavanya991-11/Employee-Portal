const { defineModel } = require('./_sql');
module.exports = defineModel({
    name: 'ImageRegister', table: 'ImageRegister',
    refs: { user: { col: 'userId', ref: 'Users' } }
});
