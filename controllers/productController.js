const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoryModel');
const Admin = require('../models/adminModel');
const fs = require("fs")
const sharp = require('sharp');
const path = require('path');

module.exports = {
    loadAddProduct: async (req, res, next) => {
        try {
            const category = await Category.find({})
            res.render('addProduct', { category: category })
        } catch (error) {
            next(error);
        }
    },

    addProduct: async (req, res, next) => {
        try {
            const { productName, productBrand, productDescription, productCategory, productPrice, productStock, productOfferPercentage } = req.body;
            const category = await Category.find({})

            const images = [];

            images[0] = 'image1_' + Date.now() + '.jpg'
            images[1] = 'image2_' + Date.now() + '.jpg'
            images[2] = 'image3_' + Date.now() + '.jpg'

            const croppedImageData1 = req.body.croppedImageData1;
            const croppedImageData2 = req.body.croppedImageData2;
            const croppedImageData3 = req.body.croppedImageData3;


            if (!croppedImageData1 || !croppedImageData2 || !croppedImageData3) {
                return res.render('addProduct', { message: 'Please upload all required images.', category: category });
            }

            const convertBase64ToJPEG = async (base64Data) => {
                const base64Image = base64Data.replace(/^data:image\/jpeg;base64,/, '');
                const buffer = Buffer.from(base64Image, 'base64');
                return sharp(buffer).jpeg().toBuffer();
            };

            const newProduct = new Product({
                productName,
                productBrand,
                productDescription,
                productCategory,
                productPrice,
                productImage: images,
                productStock,
                productOfferPercentage
            });



            croppedImage1Buffer = await convertBase64ToJPEG(croppedImageData1),
                croppedImage2Buffer = await convertBase64ToJPEG(croppedImageData2),
                croppedImage3Buffer = await convertBase64ToJPEG(croppedImageData3),

                fs.writeFileSync(path.join(__dirname, '../public/productImages', newProduct.productImage[0]), croppedImage1Buffer);
            fs.writeFileSync(path.join(__dirname, '../public/productImages', newProduct.productImage[1]), croppedImage2Buffer);
            fs.writeFileSync(path.join(__dirname, '../public/productImages', newProduct.productImage[2]), croppedImage3Buffer);

            const productData = await newProduct.save();

            if (productData) {
                res.redirect('/admin/viewProduct');
            } else {
                res.render('addProduct', { message: 'Something went wrong' });
            }
        } catch (error) {
            next(error);
        }
    },

    loadViewProducts: async (req, res, next) => {
        try {
            const page = req.query.page || 1; 
            const pageSize = 4; 

            const skip = (page - 1) * pageSize;
            let products;

            var search = '';
            if (req.query.search) {
                search = req.query.search;
                // Use a regular expression to make the search case-insensitive and match partial strings
                const searchRegex = new RegExp('.*' + search + '.*', 'i');

                products = await Product.find({
                    $or: [
                        { productName: searchRegex },
                        { productDescription: searchRegex },
                        // Add more fields to search if needed
                    ]
                }).populate('productCategory')
            } else {
                products = await Product.find().populate('productCategory').skip(skip).limit(pageSize);
            }

            const totalProducts = await Product.countDocuments();
            const totalPages = Math.ceil(totalProducts / pageSize);

            res.render('viewProduct', { data: products, currentPage: page, totalPages: totalPages });
        } catch (error) {
            next(error);
        }
    },

    unlistProduct: async (req, res, next) => {
        try {
            const id = req.query.id;
            const pro = await Product.findById(id);

            if (pro) {
                pro.isListed = !pro.isListed;
                await pro.save();
            }
            res.redirect('/admin/viewProduct')
        } catch (error) {
            next(error);
        }
    },

    deleteProduct: async (req, res, next) => {
        try {
            const id = req.query.id;

            // Use deleteOne to remove the product from the database
            await Product.deleteOne({ _id: id });

            res.redirect('/admin/viewProduct')
        } catch (error) {
            next(error);
        }
    },

    loadEditProduct: async (req, res, next) => {
        try {
            const id = req.query.id;
            const pro = await Product.findById(id).populate('productCategory');
            const cat = await Category.find();

            res.render('editProduct', { product: pro, category: cat })
        } catch (error) {
            next(error);
        }
    },

    editProduct: async (req, res, next) => {
        try {
            const { id, productName, productDescription, productCategory, productStock, productPrice, productBrand, productOfferPercentage } = req.body;

            // Extract cropped image data from the request body
            const croppedImageData1 = req.body.croppedImageData1;
            const croppedImageData2 = req.body.croppedImageData2;
            const croppedImageData3 = req.body.croppedImageData3;

            // Check if all required image data is present
            if (!croppedImageData1 || !croppedImageData2 || !croppedImageData3) {
                return res.render('editProduct', { message: 'Please upload all required images.' });
            }

            // Function to convert base64 to JPEG
            const convertBase64ToJPEG = async (base64Data) => {
                // Remove the base64 prefix if present
                const base64Image = base64Data.replace(/^data:image\/jpeg;base64,/, '');
                const buffer = Buffer.from(base64Image, 'base64');
                return sharp(buffer).jpeg().toBuffer();
            };

            // Convert and save the cropped image data
            const updatedProductImages = [
                await convertBase64ToJPEG(croppedImageData1),
                await convertBase64ToJPEG(croppedImageData2),
                await convertBase64ToJPEG(croppedImageData3),
            ];

            // Save the image files to the server (assuming 'public/productImages' is the destination)
            fs.writeFileSync(path.join(__dirname, '../public/productImages', `image1_${id}.jpg`), updatedProductImages[0]);
            fs.writeFileSync(path.join(__dirname, '../public/productImages', `image2_${id}.jpg`), updatedProductImages[1]);
            fs.writeFileSync(path.join(__dirname, '../public/productImages', `image3_${id}.jpg`), updatedProductImages[2]);

            const updatedProduct = await Product.findByIdAndUpdate(
                id,
                {
                    $set: {
                        productName,
                        productDescription,
                        productCategory,
                        productImage: [
                            `image1_${id}.jpg`,
                            `image2_${id}.jpg`,
                            `image3_${id}.jpg`,
                        ],
                        productStock,
                        productPrice,
                        productBrand,
                        productOfferPercentage,
                    },
                },
                { new: true } // Ensure that hooks are triggered
            );

            // Save the updated product
            await updatedProduct.save();


            res.redirect('/admin/viewProduct');
        } catch (error) {
            next(error);
        }
    },

    loadUserProducts: async (req, res, next) => {
        try {
            const { category: selectedCategory, sort, search, page } = req.query;
            const categories = await Category.find({ isListed: true });

            // Define the number of items per page
            const itemsPerPage = 8;

            // Calculate the skip value based on the current page
            const skip = (page - 1) * itemsPerPage || 0;

            const filterCriteria = { isListed: true };

            if (selectedCategory) {
                const categoryObject = await Category.findOne({
                    categoryName: { $regex: new RegExp(".*" + selectedCategory + ".*", "i") },
                });

                if (categoryObject) {
                    filterCriteria.productCategory = categoryObject._id;
                }
            }

            // Add search functionality
            if (search) {
                filterCriteria.productName = { $regex: new RegExp(".*" + search + ".*", "i") };
            }

            let sortOption = {};

            if (sort === "lowtohigh") {
                sortOption = { discountedPrice: 1 };
            } else if (sort === "hightolow") {
                sortOption = { discountedPrice: -1 };
            }

            // Fetch total number of products without pagination
            const totalProducts = await Product.countDocuments(filterCriteria);

            const products = await Product.find(filterCriteria)
                .populate('productCategory')
                .sort(sortOption)
                .skip(skip)
                .limit(itemsPerPage);

            res.render('productView', {
                product: products,
                category: categories,
                currentSort: sort,
                selectedCategory,
                search,
                currentPage: parseInt(page) || 1, // Parse the current page to an integer
                totalPages: Math.ceil(totalProducts / itemsPerPage), // Calculate the total pages
            });
        } catch (error) {
            next(error);
        }
    },

    loadUserProductDetails: async (req, res, next) => {

        try {
            const id = req.query.id;
            const pro = await Product.findById(id).populate('productCategory productImage');

            res.render('productDetails', { product: pro })
        } catch (error) {
            next(error);
        }
    },

}