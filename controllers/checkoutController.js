const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoryModel');
const Admin = require('../models/adminModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');


const { ObjectId } = require('mongoose').Types;
// const { ObjectId } = require('mongodb');

const bcrypt = require("bcrypt");
const { name } = require('ejs');
const path = require("path")

const Razorpay = require('razorpay')
const crypto = require("crypto")

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});





module.exports = {
    loadCheckout: async (req, res) => {
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

            // Check product quantities against available stock
            const insufficientStockProducts = cartData.items.filter((product) => {
                return product.quantity > product.productId.productStock;
            });

            if (insufficientStockProducts.length > 0) {
                console.log('Some products have insufficient stock');
                return res.redirect('/cart?error=insufficient-stock');
            }

            res.render('checkout', { user: userData, address: userAddress, cart: cartData, coupons: couponData });
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

    applyDiscount: async (req, res) => {
        try {

            const { couponCode } = req.body;

            // Fetch coupon details from the database based on the provided coupon code
            const coupon = await Coupon.findOne({ code: couponCode });

            // Check if the coupon is valid
            if (!coupon) {
                return res.status(400).json({ error: 'Invalid coupon code. Please enter a valid code.' });
            }

            // Fetch the user's cart
            const userId = req.session.userId;
            const cart = await Cart.findOne({ userId });

            // Check if the cart exists
            if (!cart) {
                return res.status(400).json({ error: 'Cart not found for the user.' });
            }

            const newSubtotal = (cart.subTotal * (100 - coupon.discountPercentage)) / 100;

            // Update the existing cart's subTotal in the database and get the updated document
            const discountedCart = await Cart.findOneAndUpdate(
                { userId },
                { $set: { subTotal: newSubtotal } },
                { new: true } // This option ensures that the updated document is returned
            );

            return res.json({ message: 'Discount applied successfully.', updatedCart: discountedCart });
            
        } catch (error) {
            console.error('Error applying discount:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    placeOrder: async (req, res) => {
        try {
            console.log('Request Body from place Order:', req.body);

            const { addressOption, paymentOption } = req.body;
            const userId = req.session.userId;

            // Check if addressOption and paymentOption are provided
            if (!addressOption || !paymentOption) {
                console.log('Invalid address or payment type');
                return res.status(400).json({ error: "Invalid address or payment type" });
            }

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

            const userAddrs = await Address.findOne({ userId: userId });

            if (!userAddrs || !userAddrs.address || userAddrs.address.length === 0) {
                console.log('User addresses not found');
                return res.status(400).json({ error: "User addresses not found" });
            }

            const shipAddress = userAddrs.address.find((address) => {
                return address._id.toString() === addressOption.toString();
            });

            if (!shipAddress) {
                console.log('Address not found');
                return res.status(400).json({ error: "Address not found" });
            }


            // Calculate the expected delivery date (7 days from now)
            const today = new Date();
            const deliveryDate = new Date(today);
            deliveryDate.setDate(today.getDate() + 7);

            // Extract the date, month, and year from the deliveryDate
            const deliveryDay = deliveryDate.getDate();
            const deliveryMonth = deliveryDate.getMonth()
            const deliveryYear = deliveryDate.getFullYear();


            const { fullName, mobile, state, district, city, pincode } = shipAddress;
            // Create a new order with status 'Placed' and set product statuses
            const order = new Order({
                user: userId,
                products: cartItems.items.map(item => ({
                    productId: item.productId._id,
                    quantity: item.quantity,
                    price: item.productId.productPrice,
                    orderStatus: 'Placed', // Set the initial status for each product as 'Placed'
                    returnOrder: {
                        status: "none",
                        reason: "none",
                    }
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

            let placeOrder;


            if (paymentOption === 'COD') {

                console.log('Entered COD');

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

                console.log('Order placed successfully');

                order.status = true

                // Save the order to the database
                placeOrder = await order.save();
                res.status(200).json({ placeOrder, message: "Order placed successfully" });

                // Clear the user's cart
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

                    /////////////////////////update stock///////////////////////////////////////
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
                    /////////////////////////update stock///////////////////////////////////////


                    // Handle the Razorpay order response here
                    res.status(200).json({ order });
                });


            }




        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Failed to place the order' });
        }
    },
    verifyPayment: async (req, res) => {
        try {
            console.log("Received payment verification request");
            console.log("Request Body from verify payment:", req.body);

            const cartData = await Cart.findOne({ userId: req.session.userId });
            const details = req.body;

            // Verify the Razorpay signature
            const hmac = crypto.createHmac("sha256", instance.key_secret);
            hmac.update(details.payment.razorpay_order_id + "|" + details.payment.razorpay_payment_id);
            const hmacValue = hmac.digest("hex");

            if (hmacValue !== details.payment.razorpay_signature) {
                // Signature verification failed
                console.log("Signature verification failed");
                await Order.findByIdAndRemove({ _id: details.order.receipt });
                return res.json({ success: false, message: "Signature verification failed" });
            }

            // Signature verification successful
            console.log("Signature verification successful");

            // Update product quantities
            for (const product of cartData.items) {
                await Product.findByIdAndUpdate(
                    { _id: product.productId },
                    { $inc: { quantity: -product.quantity } }
                );
            }

            // Update order payment status and payment ID
            const orderId = details.order.receipt;
            await Order.findByIdAndUpdate(
                orderId,
                { $set: { 'products.$[].paymentStatus': 'Success', paymentId: details.payment.razorpay_payment_id } }
            );

            // Clear the user's cart
            await Cart.deleteOne({ userId: req.session.userId });

            // Set the order status to true for successful payment
            await Order.findByIdAndUpdate(orderId, { $set: { status: true } });

            console.log("Payment successful");
            res.json({ codsuccess: true, orderid: orderId });
        } catch (error) {
            console.log("Error:", error);
            res.status(500).json({ error });
        }
    },
    loadThankyou: async (req, res) => {
        try {
            const userId = req.session.userId
            const order = await Order.findOne({ user: userId })
            res.render('thankyou', { user: userId, order })
        } catch (error) {
            console.log(error.message);
        }
    },
    // getCouponDetails: async (req, res) => {
    //     try {
    //         const couponCode = req.query.code;

    //         // Fetch coupon details from the database based on the code
    //         const couponDetails = await Coupon.findOne({ code: couponCode });

    //         if (couponDetails) {
    //             // Return the coupon details as JSON
    //             res.json({
    //                 discountPercentage: couponDetails.discountPercentage,
    //             });
    //         } else {
    //             // If the coupon is not found, return an empty response
    //             res.json({});
    //         }
    //     } catch (error) {
    //         console.error('Error fetching coupon details:', error);
    //         res.status(500).json({ error: 'Internal Server Error' });
    //     }
    // }

}