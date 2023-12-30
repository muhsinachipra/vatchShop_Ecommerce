const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoryModel');
const Admin = require('../models/adminModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const Wallet = require('../models/walletModel');


const { ObjectId } = require('mongoose').Types;

const bcrypt = require("bcryptjs");
const { name } = require('ejs');
const path = require("path")


module.exports = {
    loadProfile: async (req, res, next) => {
        try {
            const id = req.session.userId
            const userData = await User.findById({ _id: id })
            const userAddress = await Address.findOne({ userId: id })
            const orderData = await Order.find({ 'user': id }).sort({ orderDate: -1 });
            const walletData = await Wallet.findOne({ userId: id })
            // Check if userData is not null or undefined
            if (userData) {
                res.render('userProfile', { user: userData, address: userAddress, orders: orderData, error: null, wallet: walletData });
            } else {
                res.render('userProfile', { user: id, orders: [], error: 'User Data is null or undefined' });
            }
        } catch (error) {
            next(error);
        }
    },

    userLogout: async (req, res, next) => {
        try {
            if (req.session.userId) {
                delete req.session.userId;
            }
            res.redirect('/')
        } catch (error) {
            next(error);
        }
    },

    updateUser: async (req, res, next) => {
        try {

            const user_id = req.session.userId

            const details = await User.updateOne(
                { _id: user_id },
                {
                    $set: {
                        firstName: req.body.EPFname,
                        lastName: req.body.EPLname,
                        email: req.body.EPemail,
                        mobile: req.body.EPmobile,
                    },
                },
                {
                    new: true
                }
            );

            res.redirect('/userProfile')

        } catch (error) {
            next(error);
        }
    },
    profileResetPassword: async (req, res, next) => {

        try {
            const userDetails = await User.findOne({ _id: req.session.userId })

            const isPasswordMatch = await bcrypt.compare(req.body.oldPassword, userDetails.password);

            if (isPasswordMatch) {
                const newSecurePassword = await bcrypt.hash(req.body.newPassword, 10);

                await User.updateOne({ _id: userDetails._id }, { $set: { password: newSecurePassword } });

                return res.status(200).json({ success: true, message: 'Password changed successfully.' });
            } else {
                return res.status(400).json({ success: false, message: 'Incorrect old password.' });
            }

        } catch (error) {
            next(error);
        }
    },
    loadAddress: async (req, res, next) => {
        try {
            const userId = req.session.userId
            res.render('address', { user: userId })
        } catch (error) {
            next(error);
        }
    },
    addAddress: async (req, res, next) => {
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

            res.redirect('/userProfile');
        } catch (error) {
            next(error);
        }
    },
    loadEditAddress: async (req, res, next) => {
        try {

            const id = req.query.id
            const userId = req.session.userId

            let userAddress = await Address.findOne({ userId: userId }, { address: { $elemMatch: { _id: id } } })

            const address = userAddress.address

            res.render('editAddress', { user: userId, addresses: address[0] })


        } catch (error) {
            next(error);
        }
    },
    editAddress: async (req, res, next) => {
        try {
            const user_id = req.session.userId
            const addressId = req.body.id

            const details = await Address.updateOne(
                { userId: user_id, "address._id": addressId },
                {
                    $set: {
                        "address.$.fullName": req.body.fullName,
                        "address.$.pincode": req.body.pincode,
                        "address.$.city": req.body.city,
                        "address.$.mobile": req.body.mobile,
                        "address.$.state": req.body.state,
                        "address.$.district": req.body.district,
                    },
                }
            );
            res.redirect('/userProfile')

        } catch (error) {
            next(error);
        }
    },
    deleteAddress: async (req, res, next) => {
        try {

            let userAddress = await Address.findOne({ userId: req.session.userId });
            const addressToDeleteIndex = userAddress.address.findIndex(
                (address) => address.id === req.body.id
            );
            if (addressToDeleteIndex === -1) {
                return res.status(404).json({ remove: 0 });
            }
            userAddress.address.splice(addressToDeleteIndex, 1);
            await userAddress.save();
            return res.json({ remove: 1 });
        } catch (error) {
            next(error);
        }
    },
    invoiceDownload: async (req, res, next) => {
        try {
            const { orderId } = req.query;
            const orderData = await Order.findById(orderId)
                .populate("products.productId")
                .populate("user");

            if (!orderData) {
                return res.status(404).send("Order not found");
            }

            const userId = req.session.userId;
            const userData = await User.findById(userId);

            const date = new Date();

            res.render("invoice", { order: orderData, user: userData, date });
        } catch (error) {
            next(error);
        }
    },

}