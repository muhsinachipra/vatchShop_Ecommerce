const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
            }
        }
    ],
    subTotal: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Function to calculate subTotal
cartSchema.methods.calculateSubTotal = async function () {
    try {
        const productIds = this.items.map(item => item.productId);
        const products = await mongoose.model('Product').find({ _id: { $in: productIds } });

        let total = 0;

        this.items.forEach(item => {
            const product = products.find(product => product._id.equals(item.productId));
            if (product) {
                total += item.quantity * product.discountedPrice;
            }
        });

        this.subTotal = total;
        return total;
    } catch (error) {
        throw new Error('Error calculating subTotal');
    }
};

module.exports = mongoose.model('Cart', cartSchema);
