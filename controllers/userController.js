const User = require('../models/userModel');
const Product = require('../models/productModel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const otpGenerator = require("otp-generator")

const securePassword = async (password) =>{
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}


const loginLoad = async(req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}


const loadRegister = async(req,res)=>{
    try {

        res.render('registration.ejs'); 

    } catch (error) {
        console.log(error.message);
    }
}


const verifyLogin = async(req,res)=>{
    try {
        const email=req.body.email
        const password=req.body.password


        const userData= await User.findOne({email:email})
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password)
            if (passwordMatch) {
                req.session.user_id = userData._id
                res.redirect('/userHome')
            } else {
                res.render('login',{message:"incorrect email or password"})
            }
        }else{
            res.render('login',{message:"incorrect email or password"})
        }

    } catch (error) {
        console.log(error.message);
    }
}





// const insertUser = async (req,res) =>{

//     try {
//         const spassword = await securePassword(req.body.password)
//         const user = new User({
//             firstName:req.body.firstName,
//             lastName:req.body.lastName,
//             email:req.body.email,
//             password:spassword,
//         });

//     const userData = await user.save();

//         if(userData) {
//             res.render('registration', {message: "Your registration has been successfully."});
//         }
//         else{
//             res.render('registration', {message: "Your registration has been failed."});
//         }
//     } catch (error) {
//         console.log(error.message);
//     }
// }


const loadHome = async(req,res)=>{
    try {
        const pro = await Product.find()
        res.render('userHome', { product: pro })
    } catch (error) {
        console.log(error.message);
    }
}


const userLogout = async(req,res)=>{
    try {
        req.session.destroy()
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}

const loadOtp = async(req,res)=>{
    try {
        res.render('otp')
    } catch (error) {
        console.log(error.message);
    }
}


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
}


const insertUser = async (req, res) => {
    try {
        // Generate OTP
        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
        
        // Store OTP and its creation time in the session
        const currentTime = new Date();
        const otpCreationTime = currentTime.getMinutes()
        req.session.otp = {
            code: otp,
            creationTime: otpCreationTime,
        };

        const userCheck = await User.findOne({ email: req.body.email });

        if (userCheck) {
            res.render('registration', { message: "Email already exists" });
        } else {
            const spassword = await securePassword(req.body.password);

            req.session.firstName = req.body.firstName;
            req.session.lastName = req.body.lastName;
            req.session.mobileno = req.body.mobileno;
            req.session.email = req.body.email;

            if (req.body.firstName && req.body.email && req.session.lastName && req.session.mobileno) {
                if (req.body.password === req.body.passwordConfirm) {
                    req.session.password = spassword;

                    // Send OTP to the user's email
                    otpSent(req.session.email, req.session.otp.code);
                    res.render("otp");
                } else {
                    res.render("registration", { message: "Password doesn't match" });
                }
            } else {
                res.render("registration", { message: "Please enter all details" });
            }
        }
    } catch (error) {
        console.log(error.message);
    }
};



const verifyOTP = async (req, res) => {
    try {
        const enteredOTP = req.body.otp;
        const storedOTP = req.session.otp.code;
        const otpCreationTime = req.session.otp.creationTime;

        // Calculate the time difference in seconds
        const currentTimeFull = new Date();
        const currentTime = currentTimeFull.getMinutes()

        const timeDiff = (currentTime - otpCreationTime);

        if (enteredOTP === storedOTP && timeDiff <= 1) {
            // OTP is valid and within the 1-minute window
            const user = new User({
                firstName: req.session.firstName,
                lastName: req.session.lastName,
                email: req.session.email,
                mobileno: req.session.mobileno,
                password: req.session.password,
                isVerified: 1
            });

            const result = await user.save();
            res.render('login', { message: "registration successfull" });
        } else {
            res.render('otp', { message: "Invalid OTP or OTP has expired" });
        }
    } catch (error) {
        console.log(error.message);
    }
};

const resendOTP = async (req, res) =>{
    try {
        // Generate a new OTP and resend it to the user's email
        const newOTP = otpGenerator.generate(6, { upperCase: false, specialChars: false });
        req.session.otp.code = newOTP;
        // Update the OTP creation time
        const currentTime = new Date();
        req.session.otp.creationTime = currentTime.getMinutes()
        // Send the new OTP to the user's email
        otpSent(req.session.email, req.session.otp.code);

        res.render("otp", { message: "OTP resent successfully" });


    } catch (error) {
        console.log(error.message);
    }
}




module.exports = {
    loginLoad,
    verifyLogin,
    insertUser,
    loadRegister,
    loadHome,
    userLogout,
    loadOtp,
    otpSent,
    verifyOTP,
    resendOTP
}