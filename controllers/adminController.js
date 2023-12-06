const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');
const bcrypt = require('bcrypt');

const handleDatabaseError = (res, error) => {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
};


module.exports = {
    loadLogin: async (req, res) => {
        try {
            res.render('login');
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    verifyLogin: async (req, res) => {
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
            handleDatabaseError(res, error);
        }
    },

    loadDashboard: async (req, res) => {
        try {
            const totalUsers = await User.countDocuments();
            const totalOrders = await Order.countDocuments();

            // Calculate total revenue using aggregation
            const totalRevenueResult = await Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$totalAmount' }
                    }
                }
            ]);

            // Extract the totalRevenue from the result
            const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;

            // Calculate Average Order Value (AOV)
            const averageOrderValue = totalOrders !== 0 ? totalRevenue / totalOrders : 0;

            res.render('dashboard', { totalUsers, totalOrders, totalRevenue, averageOrderValue });
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    loadUsers: async (req, res) => {
        try {

            var search = '';
            if (req.query.search) {
                search = req.query.search
            }

            const page = req.query.page || 1; // Get the current page from query parameters
            const pageSize = 4; // Set your desired page size for both regular and search results

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
            handleDatabaseError(res, error);
        }
    },

    blockUser: async (req, res) => {
        try {
            const id = req.query.id;
            const user = await User.findById(id);

            if (user) {
                user.isBlocked = !user.isBlocked;
                await user.save();
            }

            res.redirect('/admin/Users');
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    loadAddCategory: (req, res) => {
        try {
            res.render('addCategory');
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    addCategory: async (req, res) => {
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
            handleDatabaseError(res, error);
        }
    },

    // loadViewCategory: async (req, res) => {
    //     try {
    //         const categories = await Category.find({});
    //         res.render('viewCategory', { category: categories });
    //     } catch (error) {
    //         handleDatabaseError(res, error);
    //     }
    // },

    loadViewCategory: async (req, res) => {
        try {
            const page = req.query.page || 1; // Get the current page from query parameters
            const pageSize = 4; // Set your desired page size

            const skip = (page - 1) * pageSize;
            let categories;

            var search = '';
            if (req.query.search) {
                search = req.query.search;
                // Use a regular expression to make the search case-insensitive and match partial strings
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
            handleDatabaseError(res, error);
        }
    },

    unlistCategory: async (req, res) => {
        try {
            const id = req.query.id;
            const category = await Category.findById(id);

            if (category) {
                category.isListed = !category.isListed;
                await category.save();
            }

            res.redirect('/admin/viewCategory');
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    loadEditCatogory: async (req, res) => {
        try {
            const id = req.query.id;
            const category = await Category.findById(id);

            if (category) {
                res.render('editCategory', { category });
            } else {
                res.redirect('/admin/viewCategory');
            }
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    editCategory: async (req, res) => {
        try {
            const { id, categoryName, categoryDescription } = req.body;
            const alreadyExists = await Category.findOne({ categoryName: { $regex: categoryName, $options: 'i' } });

            if (alreadyExists) {
                return res.render('editCategory', { message: 'Category Already Created', category: { categoryName, categoryDescription } });
            }

            await Category.findByIdAndUpdate(id, { $set: { categoryName, categoryDescription } });
            res.redirect('/admin/viewCategory');
        } catch (error) {
            handleDatabaseError(res, error);
        }
    }
};
