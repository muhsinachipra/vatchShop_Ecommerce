const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Category = require('../models/categoryModel');
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

    loadDashboard: (req, res) => {
        try {
            res.render('dashboard');
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    loadUsers: async (req, res) => {
        try {
            const users = await User.find({});
            res.render('Users', { users });
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

    loadViewCategory: async (req, res) => {
        try {
            const categories = await Category.find({});
            res.render('viewCategory', { category: categories });
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
