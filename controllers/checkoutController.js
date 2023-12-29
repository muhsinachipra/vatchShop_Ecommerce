const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoryModel');
const Admin = require('../models/adminModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const Wallet = require('../models/walletModel');
const randomstring = require('randomstring');

const { ObjectId } = require('mongoose').Types;

const bcrypt = require("bcryptjs");
const { name } = require('ejs');
const path = require("path")

const Razorpay = require('razorpay')
const crypto = require("crypto")

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});





module.exports = {
    loadCheckout: async (req, res, next) => {
        try {
            const userId = req.session.userId;
            const userData = await User.findById({ _id: userId })
            const userAddress = await Address.findOne({ userId });
            const cartData = await Cart.findOne({ userId: userId }).populate('items.productId');
            const couponData = await Coupon.find()

            if (!cartData || !cartData.items || cartData.items.length === 0) {
                console.log('Cart is empty');
                return res.redirect('/cart');
            }

            const insufficientStockProducts = cartData.items.filter((product) => {
                return product.quantity > product.productId.productStock;
            });

            if (insufficientStockProducts.length > 0) {
                console.log('Some products have insufficient stock');
                return res.redirect('/cart?error=insufficient-stock');
            }

            let razoKey = process.env.RAZORPAY_KEY_ID
            console.log('RAZORPAY_KEY_ID :', razoKey)

            res.render('checkout', { user: userData, address: userAddress, cart: cartData, coupons: couponData, razoKey });
        } catch (error) {
            next(error);
        }
    },
    checkoutLoadAddress: async (req, res, next) => {
        try {
            const userId = req.session.userId

            res.render('checkoutAddress', { user: userId })
        } catch (error) {
            next(error);
        }
    },
    checkoutAddAddress: async (req, res, next) => {
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
            next(error);
        }
    },

    placeOrder: async (req, res, next) => {
        try {
            console.log('Request Body from place Order:', req.body);

            const { addressOption, paymentOption } = req.body;
            const userId = req.session.userId;

            if (!addressOption || !paymentOption) {
                console.log('Invalid address or payment type');
                return res.status(400).json({ error: "Invalid address or payment type" });
            }

            const cartItems = await Cart.findOne({ userId: userId }).populate('items.productId');


            if (!cartItems || !cartItems.items || !Array.isArray(cartItems.items) || cartItems.items.length === 0) {
                console.log('Cart is empty. Unable to place an order.');
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty. Unable to place an order.',
                });
            }

            let totalAmount = cartItems.subTotal;

            const numericTotal = parseFloat(totalAmount);

            const userAddrs = await Address.findOne({ userId: userId });

            if (!userAddrs || !userAddrs.address || userAddrs.address.length === 0) {
                console.log('User addresses not found');
                return res.status(400).json({ error: "Address not selected" });
            }

            const shipAddress = userAddrs.address.find((address) => {
                return address._id.toString() === addressOption.toString();
            });

            if (!shipAddress) {
                console.log('Address not found');
                return res.status(400).json({ error: "Address not found" });
            }


            const today = new Date();
            const deliveryDate = new Date(today);
            deliveryDate.setDate(today.getDate() + 7);

            const deliveryDay = deliveryDate.getDate();
            const deliveryMonth = deliveryDate.getMonth()
            const deliveryYear = deliveryDate.getFullYear();


            const { fullName, mobile, state, district, city, pincode } = shipAddress;
            const order = new Order({
                user: userId,
                products: cartItems.items.map(item => ({
                    productId: item.productId._id,
                    quantity: item.quantity,
                    price: item.productId.discountedPrice,
                    orderStatus: 'Placed',
                    returnOrder: {
                        reason: "none",
                    }
                })),
                "deliveryAddress.fullName": fullName,
                "deliveryAddress.mobile": mobile,
                "deliveryAddress.state": state,
                "deliveryAddress.district": district,
                "deliveryAddress.city": city,
                "deliveryAddress.pincode": pincode,
                paymentOption: paymentOption,
                totalAmount: numericTotal,
                orderDate: new Date(),
                expectedDelivery: new Date(deliveryYear, deliveryMonth, deliveryDay)
            });

            let placeOrder;


            if (paymentOption === 'COD') {

                console.log('Entered COD');

                const stockUpdateOperations = cartItems.items.map((item) => {
                    const productId = item.productId._id;
                    const quantity = parseInt(item.quantity, 10);

                    return {
                        updateOne: {
                            filter: { _id: productId, productStock: { $gte: quantity } },
                            update: { $inc: { productStock: -quantity } },
                        },
                    };
                });

                const stockUpdateResult = await Product.bulkWrite(stockUpdateOperations);

                if (stockUpdateResult.writeErrors && stockUpdateResult.writeErrors.length > 0) {
                    console.log('Failed to update stock for some products');
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update stock for some products',
                    });
                }

                console.log('Order placed successfully');

                order.status = true

                placeOrder = await order.save();
                res.status(200).json({ placeOrder, message: "Order placed successfully" });

                await Cart.deleteOne({ userId: req.session.userId });

            } else if (paymentOption === 'Razorpay') {

                console.log('Entered Razorpay block');

                placeOrder = await order.save();
                const orderId = placeOrder._id;

                const options = {
                    amount: numericTotal * 100,
                    currency: "INR",
                    receipt: "" + orderId,
                };

                instance.orders.create(options, async function (err, order) {
                    if (err) {
                        console.error('Razorpay order creation failed:', err);
                        return razorPaymentFailed(res, "Razorpay order creation failed");
                    }


                    console.log('Razorpay Order:', order);

                    const stockUpdateOperations = cartItems.items.map((item) => {
                        const productId = item.productId._id;
                        const quantity = parseInt(item.quantity, 10);

                        return {
                            updateOne: {
                                filter: { _id: productId, productStock: { $gte: quantity } }, 
                                update: { $inc: { productStock: -quantity } },
                            },
                        };
                    });

                    const stockUpdateResult = await Product.bulkWrite(stockUpdateOperations);

                    if (stockUpdateResult.writeErrors && stockUpdateResult.writeErrors.length > 0) {
                        console.log('Failed to update stock for some products');
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to update stock for some products',
                        });
                    }

                    res.status(200).json({ order });
                });

            } else if (paymentOption === 'Wallet') {
                console.log('Entered Wallet block');
                const userWallet = await Wallet.findOne({ userId });
                if (!userWallet) {
                    return res.status(400).json({ error: 'wallet not found' });
                }

                if (userWallet.totalAmount < numericTotal) {
                    console.log('Insufficient wallet balance');
                    return res.status(400).json({ error: "Insufficient wallet balance" });
                } else {
                    console.log('Wallet balance is sufficient');
                    const stockUpdateOperations = cartItems.items.map((item) => {
                        const productId = item.productId._id;
                        const quantity = parseInt(item.quantity, 10);

                        return {
                            updateOne: {
                                filter: { _id: productId, productStock: { $gte: quantity } },
                                update: { $inc: { productStock: -quantity } },
                            },
                        };
                    });

                    const stockUpdateResult = await Product.bulkWrite(stockUpdateOperations);

                    if (stockUpdateResult.writeErrors && stockUpdateResult.writeErrors.length > 0) {
                        console.log('Failed to update stock for some products');
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to update stock for some products',
                        });
                    }
                    console.log('after stock update');
                    let transactionId = randomstring.generate(10);

                    userWallet.totalAmount -= numericTotal;
                    userWallet.walletHistory.push({
                        transactionAmount: numericTotal,
                        transactionType: 'debit',
                        transactionId,
                    });

                    await userWallet.save();

                    console.log('Order placed successfully');

                    order.status = true

                    placeOrder = await order.save();
                    res.status(200).json({ placeOrder, message: "Order placed successfully" });

                    await Cart.deleteOne({ userId: req.session.userId });
                }
            }

        } catch (error) {
            next(error);
        }
    },
    verifyPayment: async (req, res, next) => {
        try {
            console.log("Received payment verification request");
            console.log("Request Body from verify payment:", req.body);

            const cartData = await Cart.findOne({ userId: req.session.userId });
            const details = req.body;

            const hmac = crypto.createHmac("sha256", instance.key_secret);
            hmac.update(details.payment.razorpay_order_id + "|" + details.payment.razorpay_payment_id);
            const hmacValue = hmac.digest("hex");

            if (hmacValue !== details.payment.razorpay_signature) {
                console.log("Signature verification failed");
                await Order.findByIdAndRemove({ _id: details.order.receipt });
                return res.json({ success: false, message: "Signature verification failed" });
            }

            for (const product of cartData.items) {
                await Product.findByIdAndUpdate(
                    { _id: product.productId },
                    { $inc: { quantity: -product.quantity } }
                );
            }

            const orderId = details.order.receipt;
            await Order.findByIdAndUpdate(
                orderId,
                { $set: { 'products.$[].paymentStatus': 'Success', paymentId: details.payment.razorpay_payment_id } }
            );

            await Cart.deleteOne({ userId: req.session.userId });

            await Order.findByIdAndUpdate(orderId, { $set: { status: true } });

            res.json({ codsuccess: true, orderid: orderId });
        } catch (error) {
            next(error);
        }
    },
    loadThankyou: async (req, res, next) => {
        try {
            const userId = req.session.userId
            const order = await Order.findOne({ user: userId })
            res.render('thankyou', { user: userId, order })
        } catch (error) {
            next(error);
        }
    },

}