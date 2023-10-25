const mongoose = require('mongoose')


const productSchema = mongoose.Schema({

    productName: {
        type: String,
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    productBrand: {
        type: String,
        required: true
    },
    productCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    productQuantity: {
        type: Number,
        required: true
    },
    productPrice: {
        type: Number,
        required: true
    },
    productImage: {
        type: Array,
        required: true
    },
    productStatus: {
        type: Boolean,
        default: true
    }

})


module.exports = mongoose.model('Product', productSchema)   