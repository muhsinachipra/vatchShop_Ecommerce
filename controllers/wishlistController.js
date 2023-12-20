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
            const wishlistItems = await Wishlist.find({ userId }).populate('productId');

            res.render('wishlist', { wishlistItems });
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
}   