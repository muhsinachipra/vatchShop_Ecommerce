const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    productId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    }]
});

module.exports = mongoose.model('Wishlist', wishlistSchema);