const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoryModel');
const Admin = require('../models/adminModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const Wishlist = require('../models/wishlistModel');


const { ObjectId } = require('mongoose').Types;

const bcrypt = require("bcrypt");
const { name } = require('ejs');
const path = require("path")

module.exports = {
    loadWishlist: async (req, res) => {
        try {
            const userId = req.session.userId;
            const wishlist = await Wishlist.findOne({ userId }).populate('productId');

            if (!wishlist) {
                console.log('Wishlist not found for user with ID:', userId);
                return res.render('wishlist', { wishlistProducts: [] });
            }

            const wishlistProducts = wishlist.productId;

            res.render('wishlist', { wishlistProducts });
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Internal Server Error');
        }
    },
    addToWishlist: async (req, res) => {
        try {
            console.log('entered addToWishlist')
            if (req.session.userId) {
                const productId = req.body.id;
                const userId = req.session.userId;

                const userData = await User.findById(userId);
                if (!userData) {
                    return res.status(404).json({ error: 'User not found' });
                }

                const productData = await Product.findById(productId);
                if (!productData) {
                    return res.status(404).json({ error: 'Product not found' });
                }

                let userWishlist = await Wishlist.findOne({ userId: userId });

                if (!userWishlist) {
                    userWishlist = new Wishlist({ userId: userId, productId: [] });
                }

                const existingProductIndex = userWishlist.productId.indexOf(productId);

                if (existingProductIndex !== -1) {
                    return res.json({ alreadyExist: true });
                } else {
                    userWishlist.productId.push(productId);
                }

                await userWishlist.save();
                res.json({ success: true });
            } else {
                res.json({ loginRequired: true });
            }
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Internal Server Error');
        }
    },
    removeProduct: async (req, res) => {
        try {
            const proId = req.body.product;
            const user = req.session.userId;

            // Add 'await' before Wishlist.findOneAndUpdate
            const wishlistData = await Wishlist.findOneAndUpdate(
                { userId: user },
                { $pull: { productId: proId } }
            );

            // Check if the product was found and removed from the wishlist
            if (wishlistData) {
                res.json({ success: true });
            } else {
                res.json({ error: 'Product not found in the wishlist' });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'An error occurred' });
        }
    },
    // wishlistCount: async (req, res) => {
    //     try {
    //         const userId = req.session.userId;

    //         // Fetch the cart data from the database based on the user ID
    //         const cart = await Cart.findOne({ userId });

    //         // If the cart is found, send the total number of items to the client
    //         if (cart) {
    //             const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    //             res.json({ totalItems });
    //         } else {
    //             res.json({ totalItems: 0 }); // If no cart is found, assume 0 items
    //         }
    //     } catch (error) {
    //         console.log(error);
    //         res.status(500).json({ error: 'An error occurred' });
    //     }
    // },
    wishlistCount: async (req, res) => {
        try {
            const userId = req.session.userId;
    
            // Fetch the wishlist data from the database based on the user ID
            const wishlist = await Wishlist.findOne({ userId });
    
            // If the wishlist is found, send the total number of items to the client
            if (wishlist) {
                const totalItems = wishlist.productId.length;
                res.json({ totalItems });
            } else {
                res.json({ totalItems: 0 }); // If no wishlist is found, assume 0 items
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'An error occurred' });
        }
    }
    
}   