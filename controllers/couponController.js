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


module.exports = {
    loadViewCoupon: async (req, res) => {
        try {
            const page = req.query.page || 1; // Get the current page from query parameters
            const pageSize = 4; // Set your desired page size

            const skip = (page - 1) * pageSize;

            const totalCoupons = await Coupon.countDocuments();
            const totalPages = Math.ceil(totalCoupons / pageSize);


            const couponData = await Coupon.find().skip(skip).limit(pageSize);

            if (couponData) {
                res.render('viewCoupon', { couponData, currentPage: page, totalPages: totalPages })
            } else {
                console.log('couponData is null or undefined');
                res.render('viewCoupon', { couponData: [] });
            }

        } catch (error) {
            console.log(error.message);
            res.status(500).send('Internal Server Error');
        }
    },
    loadAddCoupon: async (req, res) => {
        try {
            res.render('addCoupon')
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Internal Server Error');
        }
    },
    addCoupon: async (req, res) => {
        try {

            const code = req.body.code
            const already = await Coupon.findOne({ code: code })

            if (already) {
                res.render('addCoupon', { message: 'code already exists' })
            } else {
                const { couponName, discountPercentage, startDate, expiryDate } = req.body;

                // Create a new coupon instance
                const newCoupon = new Coupon({
                    couponName,
                    code,
                    discountPercentage,
                    startDate,
                    expiryDate,
                });

                // Save the coupon to the database
                await newCoupon.save();

                // Redirect to the 'viewCoupon' page after successfully adding the coupon
                res.redirect('/admin/viewCoupon');
            }

        } catch (error) {
            console.log(error.message);
            res.status(500).send('Internal Server Error');
        }
    },
    // Controller function to delete a coupon
    deleteCoupon: async (req, res) => {
        const couponId = req.params.id;

        try {
            // Find and remove the coupon by ID
            const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

            if (!deletedCoupon) {
                return res.status(404).json({ error: 'Coupon not found' });
            }

            res.json({ message: 'Coupon deleted successfully', deletedCoupon });
        } catch (error) {
            console.error('Error deleting coupon:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    loadEditCoupon: async (req, res) => {
        try {
            const id = req.query.id;
            const coupon = await Coupon.findById(id);

            if (coupon) {
                res.render('editCoupon', { coupon });
            } else {
                res.redirect('/admin/viewCoupon');
            }
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Internal Server Error');
        }
    },
    editCoupon: async (req, res) => {
        try {
            // Extract coupon data from the request body
            const { originalCode, code, discountPercentage, startDate, expiryDate } = req.body;

            // Find the coupon by the original code in the database
            const coupon = await Coupon.findOne({ code: originalCode });

            if (!coupon) {
                return res.status(404).json({ error: 'Coupon not found' });
            }


            // Check if the new code already exists in the database
            const existingCoupon = await Coupon.findOne({ code });

            if (existingCoupon && existingCoupon._id.toString() !== coupon._id.toString()) {
                return res.render('editCoupon', { message: 'Coupon with the new code already exists', coupon });
            }


            // Update coupon properties with new values
            coupon.code = code;
            coupon.discountPercentage = discountPercentage;
            coupon.startDate = startDate;
            coupon.expiryDate = expiryDate;

            // Save the updated coupon to the database
            await coupon.save();

            res.redirect('/admin/viewCoupon');

        } catch (error) {
            console.log(error.message);
            res.status(500).send('Internal Server Error');
        }
    },

    applyCoupon: async (req, res) => {
        try {
            const { couponCode, subTotal } = req.body;
            const userId = req.session.userId;
            const coupon = await Coupon.findOne({ code: couponCode });

            if (!coupon) {
                return res.status(400).json({ error: 'Invalid coupon code. Please enter a valid code.' });
            }

            if (coupon.user && coupon.user.includes(userId)) {
                return res.status(400).json({ error: 'Coupon has already been used.' });
            }

            if (subTotal <= 1000) {
                return res.status(400).json({ error: 'Subtotal must be above 1000 to apply the coupon.' });
            }

            const cart = await Cart.findOne({ userId });

            if (!cart) {
                return res.status(400).json({ error: 'Cart not found for the user.' });
            }

            const newSubtotal = (cart.subTotal * (100 - coupon.discountPercentage)) / 100;

            // Save user ID to coupon.user for future use (user can only use the coupon one time)
            coupon.user = coupon.user ? [...coupon.user, userId] : [userId];
            await coupon.save();

            const discountedCart = await Cart.findOneAndUpdate(
                { userId },
                { $set: { subTotal: newSubtotal } },
                { new: true }
            );

            return res.json({ message: 'Discount applied successfully.', updatedCart: discountedCart });

        } catch (error) {
            console.error('Error applying discount:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },


}