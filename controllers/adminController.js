const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const bcrypt = require('bcryptjs');
const fs = require("fs")
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');


module.exports = {
    loadLogin: async (req, res, next) => {
        try {
            res.render('login');
        } catch (error) {
            next(error);
        }
    },

    verifyLogin: async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const adminData = await Admin.findOne({ email });

            if (adminData) {
                const passwordMatch = await bcrypt.compare(password, adminData.password);

                if (passwordMatch) {
                    if (adminData.isAdmin === 0) {
                        return res.render('login', { message: 'email or password is incorrect' });
                    } else {
                        req.session.admin_id = adminData._id;
                        return res.redirect('/admin/dashboard');
                    }
                }
            }

            res.render('login', { message: 'email or password is incorrect' });
        } catch (error) {
            next(error);
        }
    },

    adminLogout: async (req, res, next) => {
        try {
            if (req.session.admin_id) {
                delete req.session.admin_id;
            }
            res.redirect('/admin')
        } catch (error) {
            next(error);
        }
    },

    loadDashboard: async (req, res, next) => {
        try {
            const totalUsers = await User.countDocuments();
            const totalOrders = await Order.countDocuments();

            const totalRevenueResult = await Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$totalAmount' }
                    }
                }
            ]);

            const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;

            const averageOrderValue = totalOrders !== 0 ? totalRevenue / totalOrders : 0;

            const allProducts = await Product.find({}, 'productName');

            const revenuePerProduct = await Order.aggregate([
                {
                    $unwind: "$products",
                },
                {
                    $match: {
                        $or: [
                            { paymentOption: 'COD', 'products.orderStatus': 'Delivered' },
                            { paymentOption: { $in: ['Razorpay', 'Wallet'] }, 'products.orderStatus': { $in: ['Placed', 'Shipped', 'Out for delivery', 'Delivered'] } },
                        ],
                        'products.returnOrder.returnStatus': { $ne: 'Refund' },
                    },
                },
                {
                    $group: {
                        _id: '$products.productId',
                        totalAmount: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
                    },
                },
            ]);

            const productIds = revenuePerProduct.map(product => product._id);

            const productMap = new Map(allProducts.map(product => [product._id.toString(), product]));

            const productData = allProducts.map(product => {
                const revenueProduct = revenuePerProduct.find(rp => rp._id.toString() === product._id.toString());
                return {
                    name: product.productName,
                    revenue: revenueProduct ? revenueProduct.totalAmount : 0,
                };
            });

            const sortedProducts = productData.sort((a, b) => b.revenue - a.revenue);

            const top3Products = sortedProducts.slice(0, 3);

            const productLabels = top3Products.map(product => product.name);
            const productRevenues = top3Products.map(product => product.revenue);

            const revenuePerCategory = await Order.aggregate([
                {
                    $unwind: "$products",
                },
                {
                    $match: {
                        $or: [
                            { paymentOption: 'COD', 'products.orderStatus': 'Delivered' },
                            { paymentOption: { $in: ['Razorpay', 'Wallet'] }, 'products.orderStatus': { $in: ['Placed', 'Shipped', 'Out for delivery', 'Delivered'] } },
                        ],
                        'products.returnOrder.returnStatus': { $ne: 'Refund' },
                    },
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'products.productId',
                        foreignField: '_id',
                        as: 'productDetails',
                    },
                },
                {
                    $unwind: "$productDetails",
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'productDetails.productCategory',
                        foreignField: '_id',
                        as: 'categoryDetails',
                    },
                },
                {
                    $unwind: "$categoryDetails",
                },
                {
                    $group: {
                        _id: '$categoryDetails.categoryName',
                        totalAmount: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
                    },
                },
            ]);


            const allCategories = await Category.find({}, 'categoryName');

            const categoryData = allCategories.map(category => ({
                name: category.categoryName,
                revenue: revenuePerCategory.find(c => c._id === category.categoryName)?.totalAmount || 0,
            }));

            const sortedCategories = categoryData.sort((a, b) => b.revenue - a.revenue);

            const top3Categories = sortedCategories.slice(0, 3);

            const categoryLabels = top3Categories.map(category => category.name);
            const categoryRevenues = top3Categories.map(category => category.revenue);


            res.render('dashboard', {
                totalUsers,
                totalOrders,
                totalRevenue,
                averageOrderValue,
                productLabels,
                productRevenues,
                categoryLabels,
                categoryRevenues,
                top3Categories,
                top3Products
            });
        } catch (error) {
            next(error);
        }
    },

    loadUsers: async (req, res, next) => {
        try {

            var search = '';
            if (req.query.search) {
                search = req.query.search
            }

            const page = req.query.page || 1;
            const pageSize = 4;

            const skip = (page - 1) * pageSize;

            let users;

            if (search) {
                users = await User.find({
                    $or: [
                        { firstName: { $regex: '.*' + search + '.*', $options: 'i' } },
                        { lastName: { $regex: '.*' + search + '.*', $options: 'i' } },
                        { email: { $regex: '.*' + search + '.*', $options: 'i' } },
                        { mobileno: { $regex: '.*' + search + '.*', $options: 'i' } }
                    ]
                })
            } else {
                users = await User.find({}).skip(skip).limit(pageSize);
            }

            const totalUsers = await User.countDocuments();
            const totalPages = Math.ceil(totalUsers / pageSize);

            res.render('Users', { users, currentPage: page, totalPages: totalPages });

        } catch (error) {
            next(error);
        }
    },

    blockUser: async (req, res, next) => {
        try {
            const id = req.query.id;
            const user = await User.findById(id);

            if (user) {
                user.isBlocked = !user.isBlocked;
                await user.save();
            }

            res.redirect('/admin/Users');
        } catch (error) {
            next(error);
        }
    },

    loadAddCategory: (req, res) => {
        try {
            res.render('addCategory');
        } catch (error) {
            next(error);
        }
    },

    addCategory: async (req, res, next) => {
        try {
            const { categoryName } = req.body;
            const alreadyExists = await Category.findOne({ categoryName: { $regex: categoryName, $options: 'i' } });

            if (alreadyExists) {
                return res.render('addCategory', { message: 'Category Already Created' });
            }

            const category = new Category({ ...req.body, isListed: true });
            await category.save();

            res.redirect('/admin/addCategory');
        } catch (error) {
            next(error);
        }
    },

    loadViewCategory: async (req, res, next) => {
        try {
            const page = req.query.page || 1; 
            const pageSize = 4; 

            const skip = (page - 1) * pageSize;
            let categories;

            var search = '';
            if (req.query.search) {
                search = req.query.search;
                const searchRegex = new RegExp('.*' + search + '.*', 'i');

                categories = await Category.find({
                    $or: [
                        { categoryName: searchRegex },
                        { categoryDescription: searchRegex },
                    ]
                });
            } else {
                categories = await Category.find().skip(skip).limit(pageSize);
            }

            const totalCategories = await Category.countDocuments();
            const totalPages = Math.ceil(totalCategories / pageSize);

            res.render('viewCategory', { category: categories, currentPage: page, totalPages: totalPages });
        } catch (error) {
            next(error);
        }
    },

    unlistCategory: async (req, res, next) => {
        try {
            const id = req.query.id;
            const category = await Category.findById(id);

            if (category) {
                category.isListed = !category.isListed;
                await category.save();
            }

            res.redirect('/admin/viewCategory');
        } catch (error) {
            next(error);
        }
    },

    loadEditCatogory: async (req, res, next) => {
        try {
            const id = req.query.id;
            const category = await Category.findById(id);

            if (category) {
                res.render('editCategory', { category });
            } else {
                res.redirect('/admin/viewCategory');
            }
        } catch (error) {
            next(error);
        }
    },

    editCategory: async (req, res, next) => {
        try {
            const { id, categoryName, categoryDescription, categoryOfferPercentage } = req.body;

            const existingCategory = await Category.findById(id);
            if (!existingCategory) {
                return res.status(404).json({ error: 'Category not found' });
            }

            if (categoryName !== existingCategory.categoryName) {
                const alreadyExists = await Category.findOne({ categoryName: { $regex: `^${categoryName}$`, $options: 'i' } });
                if (alreadyExists) {
                    return res.status(401).json({ error: 'Category Already Created' });
                }
            }

            const updatedCategory = await Category.findByIdAndUpdate(
                id,
                {
                    $set: {
                        categoryName,
                        categoryDescription,
                        categoryOfferPercentage,
                    },
                },
                { new: true } 
            );

            await updatedCategory.save();

            return res.status(200).json({ success: 'Category updated successfully' });
        } catch (error) {
            next(error);
        }
    },

    loadSalesReport: async (req, res, next) => {
        try {
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;

            let matchQuery = {
                $or: [
                    {
                        paymentOption: 'COD',
                        'products.orderStatus': 'Delivered',
                        'products.returnOrder.returnStatus': { $ne: 'Refund' },
                    },
                    {
                        paymentOption: { $in: ['Razorpay', 'Wallet'] },
                        'products.orderStatus': { $in: ['Placed', 'Shipped', 'Out for delivery', 'Delivered'] },
                        'products.returnOrder.returnStatus': { $ne: 'Refund' },
                    },
                ],
                'products.returnOrder.returnStatus': { $ne: 'Refund' },
            };

            if (startDate && endDate) {
                matchQuery.orderDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate + 'T23:59:59.999Z'),
                };
            }

            const salesData = await Order.aggregate([

                {
                    $match: matchQuery,
                },
                {
                    $unwind: "$products",
                },
                {
                    $match: {
                        'products.returnOrder.returnStatus': { $ne: 'Refund' },
                    },
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'productDetails.productCategory',
                        foreignField: '_id',
                        as: 'categoryDetails',
                    },
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'products.productId',
                        foreignField: '_id',
                        as: 'productDetails',
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'userData',
                    },
                },
                {
                    $project: {
                        _id: 1,
                        orderDate: 1,
                        totalAmount: 1,
                        paymentOption: 1,
                        'products.productId': 1,
                        'products.orderStatus': 1,
                        'products.quantity': 1,
                        'products.price': 1,
                        'productDetails.productName': 1,
                        'productDetails.productCategory': 1,
                        'productDetails.discountedPrice': 1,
                        'categoryDetails.categoryName': 1,
                        'userData.firstName': 1,
                    },
                },
            ]);

            res.render('salesReport', { salesData, startDate, endDate });
        } catch (error) {
            next(error);
        }
    },

    exportSalesReport: async (req, res, next) => {
        try {
            const formatTime = (date) => {
                const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };
                return new Intl.DateTimeFormat('en-US', options).format(date);
            };

            const startDate = req.query.startDate;
            const endDate = req.query.endDate;

            let matchQuery = {
                $or: [
                    {
                        paymentOption: 'COD',
                        'products.orderStatus': 'Delivered',
                        'products.returnOrder.returnStatus': { $ne: 'Refund' },
                    },
                    {
                        paymentOption: { $in: ['Razorpay', 'Wallet'] },
                        'products.orderStatus': { $in: ['Placed', 'Shipped', 'Out for delivery', 'Delivered'] },
                        'products.returnOrder.returnStatus': { $ne: 'Refund' },
                    },
                ],
                'products.returnOrder.returnStatus': { $ne: 'Refund' },
            };

            if (startDate && endDate) {
                matchQuery.orderDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate + 'T23:59:59.999Z'),
                };
            }

            const salesData = await Order.aggregate([

                {
                    $match: matchQuery,
                },
                {
                    $unwind: "$products",
                },
                {
                    $match: {
                        'products.returnOrder.returnStatus': { $ne: 'Refund' },
                    },
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'productDetails.productCategory',
                        foreignField: '_id',
                        as: 'categoryDetails',
                    },
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'products.productId',
                        foreignField: '_id',
                        as: 'productDetails',
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'userData',
                    },
                },
                {
                    $project: {
                        _id: 1,
                        orderDate: 1,
                        totalAmount: 1,
                        paymentOption: 1,
                        'products.productId': 1,
                        'products.orderStatus': 1,
                        'products.quantity': 1,
                        'products.price': 1,
                        'productDetails.productName': 1,
                        'productDetails.productCategory': 1,
                        'productDetails.discountedPrice': 1,
                        'categoryDetails.categoryName': 1,
                        'userData.firstName': 1,
                    },
                },
            ]);

            const excelData = salesData.map(order => ({
                'Order ID': order._id,
                'Username': order.userData[0]?.firstName || '',
                'Product': order.productDetails[0]?.productName || '',
                'Category': order.productDetails[0]?.productCategory || '',
                'Price': order.products.price.toFixed(2) || '',
                'Quantity': order.products.quantity || '',
                'Order Date': order.orderDate.toDateString(),
                'Time': formatTime(new Date(order.orderDate)),
                'Payment Method': order.paymentOption || '',
                'Order Status': order.products.orderStatus || '',
            }));

            const json2csvParser = new Parser();
            const excel = json2csvParser.parse(excelData);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
            res.status(200).send(excel);

        } catch (error) {
            next(error);
        }
    },
    load500: async (req, res, next) => {
        try {
            res.render('500');
        } catch (error) {
            next(error);
        }
    },
    load404: async (req, res, next) => {
        try {
            res.render('404');
        } catch (error) {
            next(error);
        }
    },
};
