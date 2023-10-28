const express = require("express");
const user_route = express();
const session = require("express-session")
const config = require("../config/config")

user_route.use(session({secret:config.sessionSecret,resave:false,saveUninitialized:true}))
const auth = require('../middleware/userAuth')

user_route.set('view engine','ejs')
user_route.set('views','./views/users');

const bodyParser=require('body-parser')
user_route.use(bodyParser.json())
user_route.use(bodyParser.urlencoded({extended:true}))

user_route.use(express.static('public'))


// user_route.use('/public',express.static(path.join(__dirname,'../public')))
// user_route.use('/userlogin',express.static(path.join(__dirname,'../public/userlogin')))
// user_route.use('/assets',express.static(path.join(__dirname,'../public/userlogin/assets')))

const path= require("path")

const userController = require("../controllers/userController");

user_route.get('/',auth.isUserLogout,userController.loginLoad)
user_route.post('/',userController.verifyLogin)
user_route.get('/register',auth.isUserLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser);
user_route.get('/otp',auth.isUserLogout,userController.loadOtp);
user_route.post('/otp', userController.verifyOTP)
user_route.post('/resendOTP', userController.resendOTP)
user_route.get('/userHome',auth.isUserLogin,userController.loadHome)
user_route.get('/logout',auth.isUserLogin,userController.userLogout)


module.exports=user_route