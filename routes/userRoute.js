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
const productController = require("../controllers/productController");
const cartController = require("../controllers/cartController");


// user_route.get('/logout',auth.isUserLogin,userController.userLogout)


user_route.get('/',userController.loadHome)
user_route.get('/login',userController.loginLoad)
user_route.post('/login',userController.verifyLogin)
user_route.get('/register',userController.loadRegister);
user_route.post('/register',userController.insertUser);
user_route.get('/otp',userController.loadOtp);
user_route.post('/otp', userController.verifyOTP)
user_route.post('/resendOTP', userController.resendOTP)
user_route.get('/productView',productController.loadUserProducts)
user_route.get('/productDetails',productController.loadUserProductDetails)
user_route.post('/add-to-cart',cartController.addToCart)
user_route.get('/cart',auth.isUserLogin,cartController.loadCart)
user_route.post('/cart-quantity',cartController.cartQuantity)
user_route.post('/remove-product',cartController.removeProduct) 


module.exports=user_route