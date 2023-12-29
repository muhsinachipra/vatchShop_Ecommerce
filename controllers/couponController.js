const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoryModel');
const Admin = require('../models/adminModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');


const { ObjectId } = require('mongoose').Types;

const bcrypt = require("bcryptjs");
const { name } = require('ejs');
const path = require("path")

const Razorpay = require('razorpay')
const crypto = require("crypto")


module.exports = {
    loadViewCoupon: async (req, res, next) => {
        try {
            const page = req.query.page || 1; 
            const pageSize = 4;

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
            next(error);
        }
    },
    loadAddCoupon: async (req, res, next) => {
        try {
            res.render('addCoupon')
        } catch (error) {
            next(error);
        }
    },
    addCoupon: async (req, res, next) => {
        try {

            const code = req.body.code
            const already = await Coupon.findOne({ code: code })

            if (already) {
                res.render('addCoupon', { message: 'code already exists' })
            } else {
                const { couponName, discountPercentage, startDate, expiryDate } = req.body;

                const newCoupon = new Coupon({
                    couponName,
                    code,
                    discountPercentage,
                    startDate,
                    expiryDate,
                });

                await newCoupon.save();

                res.redirect('/admin/viewCoupon');
            }

        } catch (error) {
            next(error);
        }
    },
    deleteCoupon: async (req, res, next) => {
        const couponId = req.params.id;

        try {
            const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

            if (!deletedCoupon) {
                return res.status(404).json({ error: 'Coupon not found' });
            }

            res.json({ message: 'Coupon deleted successfully', deletedCoupon });
        } catch (error) {
            next(error);
        }
    },
    loadEditCoupon: async (req, res, next) => {
        try {
            const id = req.query.id;
            const coupon = await Coupon.findById(id);

            if (coupon) {
                res.render('editCoupon', { coupon });
            } else {
                res.redirect('/admin/viewCoupon');
            }
        } catch (error) {
            next(error);
        }
    },
    editCoupon: async (req, res, next) => {
        try {
            const { originalCode, code, discountPercentage, startDate, expiryDate } = req.body;

            const coupon = await Coupon.findOne({ code: originalCode });

            if (!coupon) {
                return res.status(404).json({ error: 'Coupon not found' });
            }


            const existingCoupon = await Coupon.findOne({ code });

            if (existingCoupon && existingCoupon._id.toString() !== coupon._id.toString()) {
                return res.render('editCoupon', { message: 'Coupon with the new code already exists', coupon });
            }


            coupon.code = code;
            coupon.discountPercentage = discountPercentage;
            coupon.startDate = startDate;
            coupon.expiryDate = expiryDate;

            await coupon.save();

            res.redirect('/admin/viewCoupon');

        } catch (error) {
            next(error);
        }
    },
    applyCoupon: async (req, res, next) => {
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

            coupon.user = coupon.user ? [...coupon.user, userId] : [userId];
            await coupon.save();

            const discountedCart = await Cart.findOneAndUpdate(
                { userId },
                { $set: { subTotal: newSubtotal } },
                { new: true }
            );

            return res.json({ message: 'Discount applied successfully.', updatedCart: discountedCart });

        } catch (error) {
            next(error);
        }
    },

}