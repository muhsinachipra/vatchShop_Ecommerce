const Category = require('../models/categoryModel');
const Product = require('../models/productModel');



module.exports = {
    loadAddProduct: async (req, res) => {
        try {
            const category = await Category.find({})
            res.render('addProduct', { category: category })
        } catch (error) {
            console.log(error.message);
        }
    },

    addProduct: async (req, res) => {
        try {
            const { productName, productBrand, productDescription, productCategory, productPrice, productQuantity } = req.body
            const productImage = []
            for (let i = 0; i < req.files.length; i++) {
                productImage[i] = req.files[i].filename
            }
            const newProduct = new Product({
                productName,
                productBrand,
                productDescription,
                productCategory,
                productPrice,
                productQuantity
            })
            const productData = await newProduct.save()
            if (productData) {
                res.redirect('/admin/viewProduct');
            } else {
                res.render('addProduct', { message: "Something went wrong" });
            }
        } catch (error) {
            console.log(error.message);
        }
    },

    loadViewProducts: async (req, res) => {

        try {
            const products = await Product.find()
            res.render('viewProduct', {data: products});
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    }
}