const mongoose = require('mongoose');

const imageRegisterSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        purpose: { type: String, default: 'profile', enum: ['profile', 'document', 'other'] },
        contentType: { type: String, required: true },
        size: { type: Number, required: true },
        filename: { type: String, default: '' },
        data: { type: Buffer, required: true }
    },
    { timestamps: true }
);

imageRegisterSchema.index({ user: 1, purpose: 1, createdAt: -1 });

module.exports = mongoose.model('ImageRegister', imageRegisterSchema);
