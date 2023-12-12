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

})

module.exports = mongoose.model('Category', categorySchema)