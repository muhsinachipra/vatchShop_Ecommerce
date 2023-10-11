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
            res.render('/#up', {message: "Your registration has been successfully."});
        }
        else{
            res.render('/#up', {message: "Your registration has been failed."});
        }
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loginLoad,
    verifyLogin,
    insertUser
}