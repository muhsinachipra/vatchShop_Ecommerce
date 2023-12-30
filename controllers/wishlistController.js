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

const bcrypt = require("bcryptjs");
const { name } = require('ejs');
const path = require("path")

module.exports = {
    loadWishlist: async (req, res, next) => {
        try {
            const userId = req.session.userId;
            const wishlist = await Wishlist.findOne({ userId }).populate('productId');

            if (!wishlist) {
                return res.render('wishlist', { wishlistProducts: [] });
            }

            const wishlistProducts = wishlist.productId;

            res.render('wishlist', { wishlistProducts });
        } catch (error) {
            next(error);
        }
    },
    addToWishlist: async (req, res, next) => {
        try {
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
            next(error);
        }
    },
    removeProduct: async (req, res, next) => {
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
            next(error);
        }
    },

    wishlistCount: async (req, res, next) => {
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
            next(error);
        }
    }

}   