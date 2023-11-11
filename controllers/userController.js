const User = require('../models/userModel');
const Product = require('../models/productModel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const otpGenerator = require("otp-generator");

const handleDatabaseError = (res, error) => {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
};

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        handleDatabaseError(error);
    }
};

module.exports = {
    loadLogin: async (req, res) => {
        try {
            res.render('login');
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    loginLoad: async (req, res) => {
        try {
            res.render('login');
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    verifyLogin: async (req, res) => {
        try {
            const email = req.body.email;
            const password = req.body.password;

            const userData = await User.findOne({ email: email });

            if (userData) {
                const passwordMatch = await bcrypt.compare(password, userData.password);

                if (passwordMatch) {
                    if (userData.isBlocked) {
                        res.render('login', { message: "Your account is blocked. Please contact support for assistance." });
                    } else {
                        req.session.userId = userData._id;
                        res.render('userHome');
                    }
                } else {
                    res.render('login', { message: "Incorrect email or password" });
                }
            } else {
                res.render('login', { message: "Incorrect email or password" });
            }
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    loadRegister: async (req, res) => {
        try {
            res.render('registration.ejs');
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    userLogout: async (req, res) => {
        try {
            req.session.destroy()
            res.redirect('/')
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    loadOtp: async (req, res) => {
        try {
            res.render('otp');
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    otpSent: async (email, otp) => {
        try {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                requireTLS: true,
                auth: {
                    user: 'muhsinachipra@gmail.com',
                    pass: 'azen vizj yufk ekkt',
                },
            });

            const mailOptions = {
                from: 'muhsinachipra@gmail.com',
                to: email,
                subject: 'Verify Your Email',
                html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
            };

            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.log(error.message);
        }
    },

    insertUser: async (req, res) => {
        try {
            const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
            const currentTime = new Date();
            const otpCreationTime = currentTime.getMinutes()
            req.session.otp = {
                code: otp,
                creationTime: otpCreationTime,
            };

            const { passwordConfirm, password, mobileno, email, lastName, firstName } = req.body
            req.session.email = email
            const userCheck = await User.findOne({ email });

            if (userCheck) {
                res.render('registration', { message: "Email already exists" });
            } else {
                const hashedPassword = await securePassword(password);

                if (firstName && email && lastName && mobileno) {
                    if (password === passwordConfirm) {
                        const user = new User({
                            firstName,
                            lastName,
                            email,
                            mobileno,
                            password: hashedPassword
                        });
                        const result = await user.save();

                        otpSent(email, req.session.otp.code);
                        res.render("otp");
                    } else {
                        res.render("registration", { message: "Password doesn't match" });
                    }
                } else {
                    res.render("registration", { message: "Please enter all details" });
                }
            }
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    loadHome: async (req, res) => {
        try {
            const pro = await Product.find()
            res.render('userHome', { product: pro })
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    verifyOTP: async (req, res) => {
        try {
            const enteredOTP = req.body.otp;
            const storedOTP = req.session.otp.code;
            const otpCreationTime = req.session.otp.creationTime;
            const email = req.session.email

            const currentTimeFull = new Date();
            const currentTime = currentTimeFull.getMinutes()

            const timeDiff = (currentTime - otpCreationTime);

            if (enteredOTP === storedOTP && timeDiff <= 1) {
                const user = await User.findOne({ email: email });

                if (user) {
                    user.isVerified = true;
                    const updatedUser = await user.save();

                    if (updatedUser) {
                        res.render('login', { message: "Registration successful" });
                    } else {
                        res.render('otp', { message: "Error updating user data" });
                    }
                } else {
                    res.render('otp', { message: "User not found" });
                }
            } else {
                res.render('otp', { message: "Invalid OTP or OTP has expired" });
            }
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    resendOTP: async (req, res) => {
        try {
            const newOTP = otpGenerator.generate(6, { upperCase: false, specialChars: false });
            req.session.otp.code = newOTP;
            const currentTime = new Date();
            req.session.otp.creationTime = currentTime.getMinutes()
            otpSent(req.session.email, req.session.otp.code);

            res.render("otp", { message: "OTP resent successfully" });
        } catch (error) {
            handleDatabaseError(res, error);
        }
    }
};
