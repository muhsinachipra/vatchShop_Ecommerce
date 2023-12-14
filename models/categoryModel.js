const mongoose = require("mongoose")

const categorySchema = mongoose.Schema({

    categoryName: {
        type: String,
        required: true
    },
    categoryDescription: {
        type: String,
        required: true
    },
    isListed: {
        type: Boolean,
        default: true
    },
    categoryOfferPercentage: {
        type: Number,
        default: 0,
    },
});

// Define a pre-save middleware to update all related products' discountedPrice
categorySchema.pre(['save', 'updateOne', 'updateMany'], async function (next) {
    try {
        const Product = mongoose.model('Product');
        // Find all products with the current category
        const products = await Product.find({ productCategory: this._id });

        // Iterate through products and update discountedPrice
        for (const product of products) {
            const highestPercentage = Math.max(
                this.categoryOfferPercentage,
                product.productOfferPercentage
            );

            const discountMultiplier = 1 - highestPercentage / 100;
            product.discountedPrice = product.productPrice * discountMultiplier;

            // Save the updated product
            await product.save();
        }

        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Category', categorySchema);