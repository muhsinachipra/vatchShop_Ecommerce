const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoryModel');
const Admin = require('../models/adminModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const axios = require('axios');

const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
// const { ObjectId } = require('mongodb');

const bcrypt = require("bcrypt");
const { name } = require('ejs');
const path = require("path")


module.exports = {

    loadOrderDetails: async (req, res) => {
        try {
            const userId = req.session.userId;

            // Ensure user is authenticated
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Unauthorized',
                });
            }

            const userData = await User.findById({ _id: userId });
            const orderId = req.params.orderId;


            // Fetch order details
            const order = await Order.findById(orderId).populate('products.productId')

            // Fetch order details with product and delivery address population
            // const order = await Order.findOne({ _id: orderId }).populate({
            //     "products.productId"
            // });

            // Check if the order exists
            if (!order) {
                return res.status(400).json({
                    success: false,
                    message: 'Order not found',
                });
            }

            // Render order details view with user and order data
            res.render('orderDetails', {
                user: userData,
                order: order
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({
                success: false,
                message: 'Error fetching order details',
                error: error.message, // Add this line to provide more details about the error
            });
        }

    },
    cancelOrderAjax: async (req, res) => {
        try {
            const productId = req.params.productId;

            const order = await Order.findOne({
                'products._id': productId,
            }).populate({
                path: 'products.productId',
                model: 'Product',
            });

            // Check if the order exists
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found',
                });
            }

            const invalidProduct = order.products.find(product => product._id.toString() === productId.toString() && (product.orderStatus !== 'Placed' && product.orderStatus !== 'Shipped'));

            if (invalidProduct) {
                return res.status(400).json({
                    success: false,
                    message: `Order cannot be canceled at this stage due to product "${invalidProduct.productId.productName}" with status "${invalidProduct.orderStatus}"`,
                });
            }

            let productForStockIncrease;
            let canceledQuantity;

            order.products.forEach(product => {
                if (product._id.toString() === productId.toString()) {
                    product.orderStatus = 'Cancelled';
                    productForStockIncrease = product.productId
                    canceledQuantity = product.quantity
                }
            });

            // Retrieve the product from the order
            const product = await Product.findById(productForStockIncrease);

            // Increase the product stock
            product.productStock += canceledQuantity;

            // Save the updated product
            await product.save();

            // Save the updated order
            await order.save();
            // Respond with JSON indicating success
            res.json({ success: true, message: 'Order canceled successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Failed to cancel the order' });
        }
    },
    loadAdminOrder: async (req, res) => {
        try {

            const page = req.query.page || 1; // Get the current page from query parameters
            const pageSize = 4; // Set your desired page size

            const skip = (page - 1) * pageSize;

            // Fetch all orders with user information
            const orders = await Order.find({})
                .sort({ orderDate: -1 })
                .populate({
                    path: 'user',
                    model: 'User',
                    select: 'firstName lastName' // Select the fields you want to populate
                }).skip(skip).limit(pageSize);



            const totalOrders = await Order.countDocuments();
            const totalPages = Math.ceil(totalOrders / pageSize);


            // Check if orders data is not null or undefined
            if (orders) {
                res.render('orders', { orders, currentPage: page, totalPages: totalPages });
            } else {
                console.log('Orders Data is null or undefined');
                res.render('orders', { orders: [] });
            }
        } catch (error) {
            console.log(error);
            res.render('orders', { orders: [], error: 'Error fetching orders data' });
        }
    },
    loadManageOrder: async (req, res) => {
        try {
            let orderId = req.params.orderId;
            const order = await Order.findById(orderId).populate({
                path: 'products.productId',
                model: 'Product',
            });
            if (order) {
                res.render('manageOrder', { order });
            } else {
                console.log('Order Data is null or undefined');
                res.render('manageOrder', { order: [] });
            }
        } catch (error) {
            console.log(error);
            res.render('manageOrder', { order: [], error: 'Error fetching orders data' });
        }
    },
    updateOrderStatus: async (req, res) => {
        try {
            const productId = req.params.productId;
            const newStatus = req.body.status;

            // Find the order containing the product
            const order = await Order.findOne({ 'products._id': new mongoose.Types.ObjectId(productId) });

            // Check if the order exists
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found',
                });
            }

            // FOR INCREASING THE PRODUCT STOCK WHEN NEWSTATUS IS CANCELLED
            if (newStatus === 'Cancelled') {
                console.log('newStatus', newStatus)

                let productForStockIncrease;
                let canceledQuantity;
                order.products.forEach(product => {
                    if (product._id.toString() === productId.toString()) {
                        product.orderStatus = 'Cancelled';
                        productForStockIncrease = product.productId
                        canceledQuantity = product.quantity
                    }
                });

                // Retrieve the product from the order
                const product = await Product.findById(productForStockIncrease);

                // Increase the product stock
                product.productStock += canceledQuantity;

                // Save the updated product
                await product.save();
            }

            // Find the product within the order and update its status
            const product = order.products.find(product => product._id.toString() === productId);
            if (product) {
                product.orderStatus = newStatus;
                // productForStockIncrease = product.productId
                // canceledQuantity = product.quantity
                // Update statusLevel based on newStatus
                // switch (newStatus) {
                //     case 'Shipped':
                //         product.statusLevel = 2;
                //         break;
                //     case 'Out for delivery':
                //         product.statusLevel = 3;
                //         break;
                //     case 'Delivered':
                //         product.statusLevel = 4;
                //         break;
                //     // Add more cases if needed

                //     default:
                //         // Handle other status cases
                //         break;
                // }

                await order.save();
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found in order',
                });
            }

            // Redirect back to the order details page or orders page
            res.redirect('/admin/orders');
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Failed to update order status' });
        }
    },
}