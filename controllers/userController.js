const User = require('../models/userModel');
const Product = require('../models/productModel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const otpGenerator = require("otp-generator");
const randomstring = require('randomstring');


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

const otpSent = async (email, otp) => {
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
};

//for sending recovery mail
const resetPasswordMail = async (username, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'muhsinachipra@gmail.com',
                pass: 'azen vizj yufk ekkt',
            }
        })

        const mailOptions = {
            from: 'muhsinachipra@gmail.com',
            to: email,
            subject: "For Reset Password",
            html: `<p> Hi, ${username}, please click here to <a href="http://localhost:5000/resetpassword?token=${token}"> Reset </a> your password</p>`
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email Has been Sent:-", info, response);
            }
        })

    } catch (error) {
        console.log(error);
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

            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (isPasswordValid) {
                if (user.isBlocked) {
                    return res.status(401).json({ error: "Your account is blocked. Please contact support for assistance." });
                } else {
                    // You can use session or token-based authentication as needed
                    req.session.userId = user._id;
                    return res.status(200).json({ success: "Login successful" });
                }
            } else {
                return res.status(401).json({ error: "Incorrect Password" });
            }
        } catch (error) {
            console.error('Error in login:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    loadForget: async (req, res) => {
        try {
            res.render('forgetPassword');
        } catch (error) {
            handleDatabaseError(res, error);
        }
    },

    forgotVerify: async (req, res) => {
        try {
            const email = req.body.email
            const userData = await User.findOne({ email: email })

            if (userData) {
                if (userData.isVerified === false) {
                    res.render('forgetPassword', { message: "Please verify your mail" })
                } else {
                    const randomString = randomstring.generate()
                    const updatedData = await User.updateOne({ email: email },
                        { $set: { token: randomString } })

                    resetPasswordMail(userData.firstName, userData.email, randomString)
                    res.render('forgetPassword', { message: "Please Check Your Mail to Reset Your Password" })
                }
            } else {
                res.render('forgetPassword', { message: "User email is Incorrect" })
            }
        } catch (error) {
            console.log(error);
        }
    },

    loadResetPassword: async (req, res) => {
        try {
            const token = req.query.token;

            // Assuming you have a 'token' field in your user schema
            const user = await User.findOne({ token: token });

            if (user) {
                // Render the view with the user information
                res.render('resetPassword', { user_id: user._id });
            } else {
                res.render('resetPassword', { message: 'Invalid Token' });
            }
        } catch (error) {
            console.log(error);
        }
    },

    //Resetting Password  
    resetPassword: async (req, res) => {
        try {
            const id = req.body.id;
            // console.log('User ID from form submission:', id);

            if (!id) {
                console.log('User ID is missing in the form submission');
                return res.status(400).send('User ID is missing in the form submission');
            }

            // You may want to validate the password and confirm password fields here
            const password = req.body.password;

            // Hash the new password before saving it to the database
            const hashedPassword = await bcrypt.hash(password, 10);

            // Update the user's password in the database
            const user = await User.findOneAndUpdate(
                { _id: id },
                { $set: { password: hashedPassword } },
                { new: true }
            );


            if (!user) {
                console.log('User not found in the database');
                return res.status(404).send('User not found in the database');
            }

            res.redirect("/login")

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    },

    loadRegister: async (req, res) => {
        try {
            res.render('registration');
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
