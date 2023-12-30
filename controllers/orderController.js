const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoryModel');
const Admin = require('../models/adminModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const Wallet = require('../models/walletModel');
const randomstring = require('randomstring');
const axios = require('axios');

const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;

const bcrypt = require("bcryptjs");
const { name } = require('ejs');
const path = require("path")


module.exports = {

    loadOrderDetails: async (req, res, next) => {
        try {
            const userId = req.session.userId;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Unauthorized',
                });
            }

            const userData = await User.findById({ _id: userId });
            const orderId = req.params.orderId;


            const order = await Order.findById(orderId).populate('products.productId')

            if (!order) {
                return res.status(400).json({
                    success: false,
                    message: 'Order not found',
                });
            }

            res.render('orderDetails', {
                user: userData,
                order: order
            });
        } catch (error) {
            next(error);
        }
    },
    cancelOrderAjax: async (req, res, next) => {
        try {
            const productId = req.params.productId;
            const productPrice = req.body.productPrice;

            const order = await Order.findOne({
                'products._id': productId,
            }).populate({
                path: 'products.productId',
                model: 'Product',
            });

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

            // Find or create user wallet
            let userWallet = await Wallet.findOne({ userId: req.session.userId });

            if (!userWallet) {
                userWallet = new Wallet({
                    userId: req.session.userId,
                    totalAmount: 0, // Set the initial totalAmount to 0
                    walletHistory: [],
                });
            }

            let transactionId = randomstring.generate(10);

            userWallet.totalAmount += parseInt(productPrice);
            userWallet.walletHistory.push({
                transactionAmount: productPrice,
                transactionType: 'credit',
                transactionId: transactionId + "_" + "refund",
            });

            await userWallet.save();

            order.totalAmount -= productPrice;

            let productForStockIncrease;
            let canceledQuantity;

            order.products.forEach(product => {
                if (product._id.toString() === productId.toString()) {
                    product.orderStatus = 'Cancelled';
                    productForStockIncrease = product.productId;
                    canceledQuantity = product.quantity;
                }
            });

            const product = await Product.findById(productForStockIncrease);

            product.productStock += canceledQuantity;

            await product.save();

            await order.save();

            res.json({ success: true, message: 'Order canceled successfully' });
        } catch (error) {
            next(error);
        }
    },
    loadAdminOrder: async (req, res, next) => {
        try {

            const page = req.query.page || 1;
            const pageSize = 4;

            const skip = (page - 1) * pageSize;

            const orders = await Order.find({})
                .sort({ orderDate: -1 })
                .populate({
                    path: 'user',
                    model: 'User',
                    select: 'firstName lastName'
                }).skip(skip).limit(pageSize);



            const totalOrders = await Order.countDocuments();
            const totalPages = Math.ceil(totalOrders / pageSize);


            if (orders) {
                res.render('orders', { orders, currentPage: page, totalPages: totalPages });
            } else {
                res.render('orders', { orders: [] });
            }
        } catch (error) {
            next(error);
        }
    },
    loadManageOrder: async (req, res, next) => {
        try {
            let orderId = req.params.orderId;
            const order = await Order.findById(orderId).populate({
                path: 'products.productId',
                model: 'Product',
            });
            if (order) {
                res.render('manageOrder', { order });
            } else {
                res.render('manageOrder', { order: [] });
            }
        } catch (error) {
            next(error);
        }
    },
    updateOrderStatus: async (req, res, next) => {
        try {
            const productId = req.params.productId;
            const newStatus = req.body.status;

            const order = await Order.findOne({ 'products._id': new mongoose.Types.ObjectId(productId) });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found',
                });
            }

            if (newStatus === 'Cancelled') {

                let productForStockIncrease;
                let canceledQuantity;
                order.products.forEach(product => {
                    if (product._id.toString() === productId.toString()) {
                        product.orderStatus = 'Cancelled';
                        productForStockIncrease = product.productId
                        canceledQuantity = product.quantity
                    }
                });

                const product = await Product.findById(productForStockIncrease);

                product.productStock += canceledQuantity;

                await product.save();
            }

            const product = order.products.find(product => product._id.toString() === productId);
            if (product) {
                product.orderStatus = newStatus;
                await order.save();
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found in order',
                });
            }

            res.redirect('/admin/orders');
        } catch (error) {
            next(error);
        }
    },
}