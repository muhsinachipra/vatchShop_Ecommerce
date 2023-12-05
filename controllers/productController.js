const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoryModel');
const Admin = require('../models/adminModel');
const fs = require("fs")
const sharp = require('sharp');
const path = require('path');

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
            const { productName, productBrand, productDescription, productCategory, productPrice, productStock } = req.body;
            const category = await Category.find({})

            const images = [];

            images[0] = 'image1_' + Date.now() + '.jpg'
            images[1] = 'image2_' + Date.now() + '.jpg'
            images[2] = 'image3_' + Date.now() + '.jpg'

            // Extract cropped image data from the request body
            const croppedImageData1 = req.body.croppedImageData1;
            const croppedImageData2 = req.body.croppedImageData2;
            const croppedImageData3 = req.body.croppedImageData3;


            // Check if all required image data is present
            if (!croppedImageData1 || !croppedImageData2 || !croppedImageData3) {
                return res.render('addProduct', { message: 'Please upload all required images.', category: category });
            }

            // Function to convert base64 to JPEG
            const convertBase64ToJPEG = async (base64Data) => {
                // Remove the base64 prefix if present
                const base64Image = base64Data.replace(/^data:image\/jpeg;base64,/, '');
                const buffer = Buffer.from(base64Image, 'base64');
                return sharp(buffer).jpeg().toBuffer();
            };

            // Create a new product instance
            const newProduct = new Product({
                productName,
                productBrand,
                productDescription,
                productCategory,
                productPrice,
                productImage: images,
                productStock,
            });



            // Convert and save the cropped image data
            croppedImage1Buffer = await convertBase64ToJPEG(croppedImageData1),
                croppedImage2Buffer = await convertBase64ToJPEG(croppedImageData2),
                croppedImage3Buffer = await convertBase64ToJPEG(croppedImageData3),

                // Save the image files to the server (assuming 'public/productImages' is the destination)
                fs.writeFileSync(path.join(__dirname, '../public/productImages', newProduct.productImage[0]), croppedImage1Buffer);
            fs.writeFileSync(path.join(__dirname, '../public/productImages', newProduct.productImage[1]), croppedImage2Buffer);
            fs.writeFileSync(path.join(__dirname, '../public/productImages', newProduct.productImage[2]), croppedImage3Buffer);

            // Save the product to the database
            const productData = await newProduct.save();

            if (productData) {
                res.redirect('/admin/viewProduct');
            } else {
                res.render('addProduct', { message: 'Something went wrong' });
            }
        } catch (error) {
            console.log(error.message);
        }
    },

    loadViewProducts: async (req, res) => {

        try {
            const page = req.query.page || 1; // Get the current page from query parameters
            const pageSize = 4; // Set your desired page size

            const skip = (page - 1) * pageSize;

            const totalProducts = await Product.countDocuments();
            const totalPages = Math.ceil(totalProducts / pageSize);


            const products = await Product.find().populate('productCategory').skip(skip).limit(pageSize);
            res.render('viewProduct', { data: products, currentPage: page, totalPages: totalPages });
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

    deleteProduct: async (req, res) => {
        try {
            const id = req.query.id;

            // Use deleteOne to remove the product from the database
            await Product.deleteOne({ _id: id });

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
            // const existingProduct = await Product.findById(id);


            // Extract cropped image data from the request body
            const croppedImageData1 = req.body.croppedImageData1;
            const croppedImageData2 = req.body.croppedImageData2;
            const croppedImageData3 = req.body.croppedImageData3;

            // Check if all required image data is present
            if (!croppedImageData1 || !croppedImageData2 || !croppedImageData3) {
                return res.render('addProduct', { message: 'Please upload all required images.' });
            }

            // Function to convert base64 to JPEG
            const convertBase64ToJPEG = async (base64Data) => {
                // Remove the base64 prefix if present
                const base64Image = base64Data.replace(/^data:image\/jpeg;base64,/, '');
                const buffer = Buffer.from(base64Image, 'base64');
                return sharp(buffer).jpeg().toBuffer();
            };

            // Convert and save the cropped image data
            updatedProductImages = [
                await convertBase64ToJPEG(croppedImageData1),
                await convertBase64ToJPEG(croppedImageData2),
                await convertBase64ToJPEG(croppedImageData3),
            ];


            // // Create an array to store the updated product images
            // const updatedProductImages = [];

            // // Iterate over the product images and check if they are updated
            // for (let i = 0; i < existingProduct.productImage.length; i++) {
            //     if (req.files[i]) {
            //         // If an updated image is available, use it
            //         updatedProductImages.push(req.files[i].filename);
            //     } else {
            //         // Otherwise, keep the existing image
            //         updatedProductImages.push(existingProduct.productImage[i]);
            //     }
            // }

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
            const categories = await Category.find({ isListed: true });
            const products = await Product.find({ isListed: true }).populate('productCategory');
            res.render('productView', { product: products, category: categories });
        } catch (error) {
            console.log(error.message);
        }
    },

    loadSortedUserProducts: async (req, res) => {
        try {
            const sortBy = req.query.sortBy || 'default'; // Default sorting
            const categories = await Category.find({ isListed: true });

            let products;

            if (sortBy === 'lowToHigh') {
                products = await Product.find({ isListed: true }).sort({ productPrice: 1 }).populate('productCategory');
            } else if (sortBy === 'highToLow') {
                products = await Product.find({ isListed: true }).sort({ productPrice: -1 }).populate('productCategory');
            } else {
                // Default sorting
                products = await Product.find({ isListed: true }).populate('productCategory');
            }

            res.render('productView', { product: products, category: categories, sortBy: sortBy });
        } catch (error) {
            console.log(error.message);
        }
    },


    loadUserProductDetails: async (req, res) => {

        try {
            const id = req.query.id;
            const pro = await Product.findById(id).populate('productCategory productImage');

            res.render('productDetails', { product: pro })
        } catch (error) {
            console.log(error.message);
        }
    },


}