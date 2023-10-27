const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Admin = require('../models/adminModel');
const User = require('../models/userModel');
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
                productQuantity,
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
            const { id, productName, productDescription, productCategory, productQuantity, productPrice, productBrand } = req.body;
            const productImage = []
            for (let i = 0; i < req.files.length; i++) {
                productImage[i] = req.files[i].filename
            }
            await Product.findByIdAndUpdate(id, {
                $set: { productName, productDescription, productCategory, productImage, productQuantity, productPrice, productBrand }
            });
            res.redirect('/admin/viewProduct');
        } catch (error) {
            console.log(error.message);
        }
    }


}