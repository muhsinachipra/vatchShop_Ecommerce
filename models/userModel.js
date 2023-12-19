const mongoose = require("mongoose");
const uuid = require("uuid");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobileno: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    token: {
        type: String,
        default: ''
    },
    referalCode: {
        type: String,
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
    },
});

// Middleware to generate a random string for referalCode before saving the user
userSchema.pre("save", function (next) {
    // Generate a random string using uuid
    this.referalCode = uuid.v4();
    next();
});

module.exports = mongoose.model('User', userSchema);
