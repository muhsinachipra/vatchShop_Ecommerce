const Admin = require('../models/adminModel');
const bcrypt = require('bcrypt');

const loadLogin = async (req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}

// const securePassword = async (password) =>{
//     try {
//         const passwordHash = await bcrypt.hash(password, 10);
//         return passwordHash;
//     } catch (error) {
//         console.log(error.message);
//     }
// }

const verifyLogin = async (req,res)=>{
    try {

        const email = req.body.email
        const password = req.body.password

        const adminData = await Admin.findOne({ email:email })
        if(adminData){

            const passwordMatch = await bcrypt.compare(password,adminData.password)

            if (passwordMatch) {
                if (adminData.isAdmin === 0) {
                    res.render('login',{message:"email or password is incorrect"})
                } else {
                    req.session.admin_id = adminData._id;
                    res.redirect("/admin/dashboard")
                }
            } else {
                res.render('login',{message:"email or password is incorrect"})
            }
        }
        else{
            res.render('login',{message:"email or password is incorrect"})
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports={
    loadLogin,
    verifyLogin
}