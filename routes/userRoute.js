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

// Middleware to set isLoggedIn in locals for every request
user_route.use((req, res, next) => {
    res.locals.isLoggedIn = !!req.session.userId;
    next();
});

const path = require("path")

const userController = require("../controllers/userController");
const productController = require("../controllers/productController");
const cartController = require("../controllers/cartController");
const profileController = require("../controllers/profileController");
const checkoutController = require("../controllers/checkoutController");
const orderController = require("../controllers/orderController");
const wishlistController = require("../controllers/wishlistController");
const walletController = require("../controllers/walletController");
const couponController = require("../controllers/couponController");

user_route.get('/', userController.loadHome)
user_route.get('/login', userController.loginLoad)
user_route.post('/loginValidation', userController.verifyLogin)
user_route.get('/forget', userController.loadForget)
user_route.post('/forget', userController.forgotVerify)
user_route.get('/forgotPassword', userController.loadForgotPassword)
user_route.post('/forgotPassword', userController.forgotPassword)

user_route.get('/register', userController.loadRegister);
user_route.post('/register', userController.insertUser);
user_route.get('/otp', userController.loadOtp);
user_route.post('/otp', userController.verifyOTP)
user_route.post('/resendOTP', userController.resendOTP)
user_route.get('/productView', productController.loadUserProducts);
user_route.get('/productDetails', productController.loadUserProductDetails)
user_route.post('/add-to-cart', cartController.addToCart)
user_route.get('/cart', auth.isUserLogin, cartController.loadCart)
user_route.post('/cart-quantity', cartController.cartQuantity)
user_route.get('/cartCount', cartController.cartCount)

user_route.post('/remove-product', cartController.removeProduct)

user_route.get('/userProfile', auth.isUserLogin, profileController.loadProfile)
user_route.get('/invoice', auth.isUserLogin, profileController.invoiceDownload)
user_route.get('/logout', profileController.userLogout)
user_route.post('/updateUser', profileController.updateUser);
user_route.post('/profileResetPassword', profileController.profileResetPassword);

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
user_route.get("/thankyou", auth.isUserLogin, checkoutController.loadThankyou);

user_route.post('/applyCoupon', couponController.applyCoupon);

user_route.get('/orderdetails/:orderId', auth.isUserLogin, orderController.loadOrderDetails);
user_route.post('/cancelorder/:productId', orderController.cancelOrderAjax);

user_route.get('/wishlist', auth.isUserLogin, wishlistController.loadWishlist);
user_route.post('/addtowishlist', wishlistController.addToWishlist)
user_route.post('/removeFromWishlist', wishlistController.removeProduct)
user_route.get('/wishlistCount', wishlistController.wishlistCount)


user_route.get('/wallet', auth.isUserLogin, walletController.loadAddWallet);
user_route.post('/addToWallet', auth.isUserLogin, walletController.addToWallet);
user_route.post("/verifyWalletPayment", walletController.verifyWalletPayment);

user_route.use((err, req, res, next) => {
    res.status(500).render("500");
});

// user_route.use((req, res, next) => {
//     res.status(404).render("404");
// })

module.exports = user_route