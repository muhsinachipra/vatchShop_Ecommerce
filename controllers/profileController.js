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
    loadProfile: async (req, res) => {
        try {
            const id = req.session.userId
            const userData = await User.findById({ _id: id })
            const userAddress = await Address.findOne({ userId: id })
            const orderData = await Order.find({ 'user': id }).sort({ orderDate: -1 });

            // Check if userData is not null or undefined
            if (userData) {
                res.render('userProfile', { user: userData, address: userAddress, orders: orderData, error: null });
            } else {
                console.log('User Data is null or undefined');
                res.render('userProfile', { user: id, orders: [], error: 'User Data is null or undefined' });
            }

        } catch (error) {
            console.log(error);
            res.render('userProfile', { user: req.session.userId, address: null, orders: [], error: 'Error fetching user data' });
        }
    },
    userLogout: async (req, res) => {
        try {
            req.session.destroy()
            res.redirect('/')
        } catch (error) {
            console.log(error.message);
        }
    },
    updateUser: async (req, res) => {
        try {

            const user_id = req.session.userId

            const details = await User.updateOne(
                { _id: user_id },
                {
                    $set: {
                        firstName: req.body.Fname,
                        lastName: req.body.Lname,
                        email: req.body.email,
                        mobile: req.body.mobile,
                    },
                },
                {
                    new: true
                }
            );

            res.redirect('/userProfile')

        } catch (error) {
            console.log(error);
        }
    },
    resetPassword: async (req, res) => {

        try {
            const userDetails = await User.findOne({ _id: req.session.userId })

            bcrypt.compare(req.body.oldPassword, userDetails.password)
                .then(async (status) => {
                    if (status) {
                        const newSecurePassword = await bcrypt.hash(req.body.newPassword, 10);

                        const change = await User.updateOne(
                            { _id: userDetails._id },
                            { $set: { password: newSecurePassword } }
                        );
                        console.log(change);
                        res.redirect("/userProfile");
                        console.log("password changed...");
                    } else {
                        console.log("wrong old password");
                        res.redirect("/userProfile");
                    }

                })
        } catch (error) {
            console.log(error);
        }
    },
    loadAddress: async (req, res) => {
        try {
            const userId = req.session.userId
            res.render('address', { user: userId })
        } catch (error) {
            console.log(error.message);
        }
    },
    addAddress: async (req, res) => {
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
            console.log(error.message);
        }
    },
    loadEditAddress: async (req, res) => {
        try {

            const id = req.query.id
            const userId = req.session.userId

            let userAddress = await Address.findOne({ userId: userId }, { address: { $elemMatch: { _id: id } } })

            const address = userAddress.address

            res.render('editAddress', { user: userId, addresses: address[0] })


        } catch (error) {
            console.log(error);
        }
    },
    editAddress: async (req, res) => {
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
            console.log(error.message);
        }
    },
    deleteAddress: async (req, res) => {
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
            console.log(error.message);
        }
    },
    
}