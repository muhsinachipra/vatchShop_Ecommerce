const User = require('../models/userModel');

const bcrypt = require('bcrypt');

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
                res.redirect('/home')
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





const insertUser = async (req,res) =>{

    try {
        const spassword = await securePassword(req.body.password)
        const user = new User({
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            email:req.body.email,
            password:spassword,
        });

    const userData = await user.save();

        if(userData) {
            res.render('registration', {message: "Your registration has been successfully."});
        }
        else{
            res.render('registration', {message: "Your registration has been failed."});
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadHome = async(req,res)=>{
    try {
        res.render('home')
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

const nodemailer = require('nodemailer');


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
            html: <p>Your OTP is: <strong>${otp}</strong></p>,
        };

        await transporter.sendMail(mailOptions);
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
    otpSent
}