const mongoose = require('mongoose');

// Define the order schema
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },
    cart: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        products: [{
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
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
            status: {
                type: String,
                enum: ['Placed', 'Shipped', 'Delivered', 'Cancelled'],
                default: 'Placed',
            }
        }],
    },
    deliveryAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address', // Reference to the Address model
        required: true,
    },
    paymentOption: {
        type: String,
        enum: ['COD', 'PayPal', 'Other'],
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    orderDate: {
        type: Date,
        default: Date.now,
    }
});

// Create and export the Order model
module.exports = mongoose.model('Order', orderSchema);