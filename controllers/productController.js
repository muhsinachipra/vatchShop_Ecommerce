const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoryModel');
const Admin = require('../models/adminModel');
const fs = require("fs")


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
            const { productName, productBrand, productDescription, productCategory, productPrice, productStock } = req.body
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
                productStock,
                productImage
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
            const products = await Product.find().populate('productCategory');
            res.render('viewProduct', { data: products });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    },

    unlistProduct: async (req, res) => {
        try {
            const id = req.query.id;
            const pro = await Product.findById(id);

            if (pro) {
                pro.isListed = !pro.isListed;
                await pro.save();
            }
            res.redirect('/admin/viewProduct')
        } catch (error) {
            console.log(error.message);
        }
    },

    loadEditProduct: async (req, res) => {
        try {
            const id = req.query.id;
            const pro = await Product.findById(id).populate('productCategory');
            const cat = await Category.find();

            res.render('editProduct', { product: pro, category: cat })
        } catch (error) {
            console.log(error.message);
        }
    },

    editProduct: async (req, res) => {
        try {
            const { id, productName, productDescription, productCategory, productStock, productPrice, productBrand } = req.body;
    
            // Retrieve the existing product data
            const existingProduct = await Product.findById(id);
    
            // Create an array to store the updated product images
            const updatedProductImages = [];
    
            // Iterate over the product images and check if they are updated
            for (let i = 0; i < existingProduct.productImage.length; i++) {
                if (req.files[i]) {
                    // If an updated image is available, use it
                    updatedProductImages.push(req.files[i].filename);
                } else {
                    // Otherwise, keep the existing image
                    updatedProductImages.push(existingProduct.productImage[i]);
                }
            }
    
            await Product.findByIdAndUpdate(id, {
                $set: {
                    productName,
                    productDescription,
                    productCategory,
                    productImage: updatedProductImages,
                    productStock,
                    productPrice,
                    productBrand,
                }
            });
            res.redirect('/admin/viewProduct');
        } catch (error) {
            console.log(error.message);
        }
    },
    

    loadUserProducts: async (req, res) => {

        try {
            const products = await Product.find()
            res.render('productView', { product: products });
        } catch (error) {
            console.log(error.message);
            // res.status(500).send('Internal Server Error');
        }
    },

    loadUserProductDetails: async (req, res) => {

        try {
            const id = req.query.id;
            const pro = await Product.findById(id).populate('productCategory productImage');

            res.render('productDetails', { product: pro })
        } catch (error) {
            console.log(error.message);
            // res.status(500).send('Internal Server Error');
        }
    },


}