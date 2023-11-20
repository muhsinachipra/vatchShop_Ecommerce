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
                const { discountPercentage, startDate, expiryDate } = req.body;

                // Create a new coupon instance
                const newCoupon = new Coupon({
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
    }
}