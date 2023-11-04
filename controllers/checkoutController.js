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
    },
    placeOrder: async (req, res) => {
        try {
            // Get the user's ID from the authenticated user (assuming you have implemented user authentication)
            const userId = req.session.userId;

            // Retrieve the selected address ID from the request body
            const selectedAddressId = req.body.addressOption;

            // Get the user's cart data (assuming you have a cart system implemented)
            const cart = await Cart.findOne({ userId: userId }).populate('items.productId');

            // Calculate the total order amount based on the cart contents
            let totalAmount = 0;
            for (const item of cart.items) {
                totalAmount += item.productId.productPrice * item.quantity;
            }

            // Create the order document
            const order = new Order({
                user: userId,
                cart: {
                    user: userId,
                    products: cart.items,
                },
                deliveryAddress: selectedAddressId,
                paymentOption: req.body.paymentOption, // Get the selected payment option from the request
                totalAmount: totalAmount,
            });

            // Save the order to the database
            await order.save();

            // Clear the user's cart (you should implement a cart clearing mechanism)
            // For example, you can update the user's cart in the User model or a dedicated Cart model

            // Update the user's order history (you should implement this as needed)

            // Respond with a success message
            res.redirect('/thankyou')
        } catch (error) {
            console.log(error.message);
        }
    }
}