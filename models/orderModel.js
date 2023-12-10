const mongoose = require('mongoose');

// Define the order schema
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            default: 1,
        },
        price: {
            type: Number,
            default: 0,
        },
        orderStatus: {
            type: String,
            enum: ['Placed', 'Shipped', 'Delivered', 'Cancelled', 'Out for delivery'],
            default: 'Placed',
        },
        returnOrder: {
            status: {
                type: Boolean,
                default: false,
            },
            returnStatus: {
                type: String,
                enum: ['Placed', 'Out for pickup', 'Returned', 'Refund'],
                default: 'Placed',
            },
            reason: {
                type: String
            }
        }
    }],
    deliveryAddress: {

        fullName: {
            type: String,
            required: true,
        },
        mobile: {
            type: String,
            required: true,
        },
        pincode: {
            type: Number,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
    },
    paymentOption: {
        type: String,
        enum: ['COD', 'PayPal', 'Razorpay', 'Wallet'],
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
    expectedDelivery: {
        type: Date,
        required: true
    },
    status: {
        type: Boolean,
        default: false, // Set the default value to false
    }
});

// Create and export the Order model
module.exports = mongoose.model('Order', orderSchema);