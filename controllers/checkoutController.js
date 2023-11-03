const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoryModel');
const Admin = require('../models/adminModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');


const { ObjectId } = require('mongoose').Types;
// const { ObjectId } = require('mongodb');

const bcrypt = require("bcrypt");
const { name } = require('ejs');
const path = require("path")


module.exports = {
    loadCheckout: async (req, res) => {
        try {
            const userId = req.session.userId;
            console.log(userId);
            const userData = await User.findById({ _id: userId })
            console.log(userData);
            const userAddress = await Address.findOne({ userId });
            const cartData = await Cart.findOne({ userId: userId }).populate('items.productId');

            res.render('checkout', { user: userData, address: userAddress, cart: cartData });
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Internal Server Error');
        }
    }
}