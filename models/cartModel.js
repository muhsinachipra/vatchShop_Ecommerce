const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the user who owns the cart
        ref: 'User', // This should match the name of your User model
        required: true
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId, // Reference to the product
                ref: 'Product', // This should match the name of your Product model
                required: true
            },
            quantity: {
                type: Number,
                required: true,
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }

})

module.exports = mongoose.model('Cart', cartSchema)