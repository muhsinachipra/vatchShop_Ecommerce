const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    totalAmount: {
        type: Number,
        default: 0,
    },
    walletHistory: [
        {
            transactionId: {
                type: String,
            },
            transactionDate: {
                type: Date,
                default: Date.now,
            },
            transactionAmount: {
                type: Number,
                required: true,
            },
            transactionType: {
                type: String,
                enum: ['credit', 'debit'],
                required: true,
                lowercase: true, // Add this to ensure enum values are stored in lowercase
            },
        }
    ],
});

module.exports = mongoose.model('Wallet', walletSchema);
