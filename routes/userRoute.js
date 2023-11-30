const express = require("express");
const user_route = express();
const session = require("express-session")
const config = require("../config/config")

user_route.use(session({ secret: config.sessionSecret, resave: false, saveUninitialized: true }))
const auth = require('../middleware/userAuth')

// user_route.set('view engine', 'ejs')
user_route.set('views', './views/users');

const bodyParser = require('body-parser')
user_route.use(bodyParser.json())
user_route.use(bodyParser.urlencoded({ extended: true }))

user_route.use(express.static('public'))


// user_route.use('/public',express.static(path.join(__dirname,'../public')))
// user_route.use('/userlogin',express.static(path.join(__dirname,'../public/userlogin')))
// user_route.use('/assets',express.static(path.join(__dirname,'../public/userlogin/assets')))

const path = require("path")

const userController = require("../controllers/userController");
const productController = require("../controllers/productController");
const cartController = require("../controllers/cartController");
const profileController = require("../controllers/profileController");
const checkoutController = require("../controllers/checkoutController");
const orderController = require("../controllers/orderController");


// user_route.get('/logout',auth.isUserLogin,userController.userLogout)


user_route.get('/', userController.loadHome)
user_route.get('/login', userController.loginLoad)
user_route.post('/loginValidation', userController.verifyLogin)
user_route.get('/forget', userController.loadForget)
user_route.post('/forget', userController.forgotVerify)
user_route.get('/resetPassword', userController.loadResetPassword)
user_route.post('/resetPassword', userController.resetPassword)

user_route.get('/register', userController.loadRegister);
user_route.post('/register', userController.insertUser);
user_route.get('/otp', userController.loadOtp);
user_route.post('/otp', userController.verifyOTP)
user_route.post('/resendOTP', userController.resendOTP)
user_route.get('/productView', productController.loadUserProducts);
user_route.get('/productView/sorted', productController.loadSortedUserProducts);
user_route.get('/productDetails', productController.loadUserProductDetails)
user_route.post('/add-to-cart', cartController.addToCart)
user_route.get('/cart', auth.isUserLogin, cartController.loadCart)
user_route.post('/cart-quantity', cartController.cartQuantity)
user_route.get('/cartCount', cartController.cartCount)

user_route.post('/remove-product', cartController.removeProduct)

user_route.get('/userProfile', auth.isUserLogin, profileController.loadProfile)
user_route.get('/logout', profileController.userLogout)
user_route.post('/updateUser', profileController.updateUser);
user_route.post('/resetPassword', profileController.resetPassword);

user_route.get('/address', auth.isUserLogin, profileController.loadAddress);
user_route.post('/addAddress', profileController.addAddress);
user_route.get('/editAddress', auth.isUserLogin, profileController.loadEditAddress);
user_route.post('/editAddress', profileController.editAddress);
user_route.delete('/deleteAddress', profileController.deleteAddress);

user_route.get("/checkout", auth.isUserLogin, checkoutController.loadCheckout);
user_route.post("/placeOrder", checkoutController.placeOrder);
user_route.post("/verifyPayment", checkoutController.verifyPayment);
user_route.get('/checkoutAddress', auth.isUserLogin, checkoutController.checkoutLoadAddress);
user_route.post('/checkoutAddAddress', checkoutController.checkoutAddAddress);

user_route.post('/applyDiscount', checkoutController.applyDiscount);

user_route.get("/thankyou", auth.isUserLogin, checkoutController.loadThankyou);

user_route.get('/orderdetails/:orderId', auth.isUserLogin, orderController.loadOrderDetails);
user_route.post('/cancelorder/:productId', orderController.cancelOrderAjax);


module.exports = user_route