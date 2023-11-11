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
            const userData = await User.findById({ _id: userId })
            const userAddress = await Address.findOne({ userId });
            const cartData = await Cart.findOne({ userId: userId }).populate('items.productId');

            if (!cartData || !cartData.items || cartData.items.length === 0) {
                console.log('Cart is empty');
                return res.redirect('/cart');
            }

            // Check product quantities against available stock
            const insufficientStockProducts = cartData.items.filter((product) => {
                return product.quantity > product.productId.productStock;
            });

            if (insufficientStockProducts.length > 0) {
                console.log('Some products have insufficient stock');
                return res.redirect('/cart?error=insufficient-stock');
            }

            res.render('checkout', { user: userData, address: userAddress, cart: cartData });
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Internal Server Error');
        }
    },
    checkoutLoadAddress: async (req, res) => {
        try {
            const userId = req.session.userId
            res.render('checkoutAddress', { user: userId })
        } catch (error) {
            console.log(error.message);
        }
    },
    checkoutAddAddress: async (req, res) => {
        try {
            let userAddress = await Address.findOne({ userId: req.session.userId });
            if (!userAddress) {
                userAddress = new Address({
                    userId: req.session.userId,
                    address: [
                        {
                            fullName: req.body.fullName,
                            mobile: req.body.mobile,
                            state: req.body.state,
                            district: req.body.district,
                            city: req.body.city,
                            pincode: req.body.pincode,
                        },
                    ],
                });
            } else {

                userAddress.address.push({
                    fullName: req.body.fullName,
                    mobile: req.body.mobile,
                    state: req.body.state,
                    district: req.body.district,
                    city: req.body.city,
                    pincode: req.body.pincode,
                });
            }

            let result = await userAddress.save();

            res.redirect('/checkout');
        } catch (error) {
            console.log(error.message);
        }
    },
    placeOrder: async (req, res) => {
        try {
            const { addressOption, paymentOption } = req.body;
            const userId = req.session.userId;

            // Fetch cart items
            const cartItems = await Cart.findOne({ userId: userId }).populate('items.productId');


            // Check if the cart is empty or cartItems is null
            if (!cartItems || !cartItems.items || !Array.isArray(cartItems.items) || cartItems.items.length === 0) {
                console.log('Cart is empty. Unable to place an order.');
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty. Unable to place an order.',
                });
            }

            // Calculate the total order amount based on the cart contents
            let totalAmount = 0;
            for (const item of cartItems.items) {
                totalAmount += item.productId.productPrice * item.quantity;
            }
            console.log(`totalAmount: ${totalAmount}`)

            // Parse totalAmount as a number
            const numericTotal = parseFloat(totalAmount);

            // Include address details in the order
            const addressDetails = await Address.findOne({
                'address._id': addressOption,
            });


            // Calculate the expected delivery date (7 days from now)
            const today = new Date();
            const deliveryDate = new Date(today);
            deliveryDate.setDate(today.getDate() + 7);

            // Extract the date, month, and year from the deliveryDate
            const deliveryDay = deliveryDate.getDate();
            const deliveryMonth = deliveryDate.getMonth()
            const deliveryYear = deliveryDate.getFullYear();



            if (!addressDetails || !ObjectId.isValid(addressOption)) {
                console.log('Invalid or not found address ID.');
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or not found address ID. Unable to place an order.',
                });
            }

            // Assuming 'address' is an array, find the specific address within the array
            const selectedAddress = addressDetails.address.find(
                (address) => address._id.toString() === addressOption
            );

            if (!selectedAddress) {
                console.log('Invalid or not found address ID.');
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or not found address ID. Unable to place an order.',
                });
            }

            const { fullName, mobile, state, district, city, pincode } = selectedAddress;
            // Create a new order with status 'Placed' and set product statuses
            const newOrder = new Order({
                user: userId,
                products: cartItems.items.map(item => ({
                    productId: item.productId._id,
                    quantity: item.quantity,
                    price: item.productId.productPrice,
                    status: 'Placed', // Set the initial status for each product as 'Placed'
                })),
                "deliveryAddress.fullName": fullName,
                "deliveryAddress.mobile": mobile,
                "deliveryAddress.state": state,
                "deliveryAddress.district": district,
                "deliveryAddress.city": city,
                "deliveryAddress.pincode": pincode, // Use the ObjectId of the selected address
                paymentOption: paymentOption,
                totalAmount: numericTotal,
                orderDate: new Date(),
                expectedDelivery: new Date(deliveryYear, deliveryMonth, deliveryDay) // Set the expected delivery date with only date, month, and year
            });

            // Save the order to the database
            await newOrder.save();

            // Update product stock (for COD payments)
            if (paymentOption === 'COD') {
                // Use bulkWrite to update stock atomically
                const stockUpdateOperations = cartItems.items.map((item) => {
                    const productId = item.productId._id;
                    const quantity = parseInt(item.quantity, 10);

                    return {
                        updateOne: {
                            filter: { _id: productId, productStock: { $gte: quantity } }, // Ensure enough stock
                            update: { $inc: { productStock: -quantity } },
                        },
                    };
                });

                // Execute the bulkWrite operation
                const stockUpdateResult = await Product.bulkWrite(stockUpdateOperations);

                // Check if any stock update failed
                if (stockUpdateResult.writeErrors && stockUpdateResult.writeErrors.length > 0) {
                    console.log('Failed to update stock for some products');
                    // Handle the case where the stock update failed, e.g., redirect to an error page
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update stock for some products',
                    });
                }
            }

            // Clear the user's cart
            await Cart.findOneAndUpdate({ userId: userId }, { $set: { items: [] } });

            // Redirect to the orderplaced route
            res.redirect('/thankyou');
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Failed to place the order' });
        }
    },
    loadThankyou: async (req, res) => {
        try {
            const userId = req.session.userId
            res.render('thankyou', { user: userId })
        } catch (error) {
            console.log(error.message);
        }
    }
}