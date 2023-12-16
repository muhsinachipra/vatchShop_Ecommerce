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
            const wishlistItems = await Wishlist.find({ userId });

            res.render('wishlist', { wishlistItems });
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Internal Server Error');
        }
    },
}   