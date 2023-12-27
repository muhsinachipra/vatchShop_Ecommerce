const express = require('express')
const admin_route = express()


const session = require('express-session')
const config = require('../config/config')
admin_route.use(session({ secret: config.sessionSecret, resave: false, saveUninitialized: true }))

const multer = require("multer");
const path = require("path")

const auth = require('../middleware/adminAuth')

const bodyParser = require('body-parser')
admin_route.use(bodyParser.json())
admin_route.use(bodyParser.urlencoded({ extended: true }))


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/productImages'));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name)
    }
})


const upload = multer({ storage: storage });


admin_route.set('view engine', 'ejs')
admin_route.set('views', './views/admin')

const adminController = require('../controllers/adminController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')



admin_route.get('/', auth.isAdminLogout, adminController.loadLogin)
admin_route.post('/', adminController.verifyLogin)
admin_route.get('/dashboard', auth.isAdminLogin, adminController.loadDashboard)
admin_route.get('/Users', auth.isAdminLogin, adminController.loadUsers)
admin_route.get('/block_users', auth.isAdminLogin, adminController.blockUser)
admin_route.get('/adminLogout', adminController.adminLogout)

//==================== category related ======================================//

admin_route.get('/addCategory', auth.isAdminLogin, adminController.loadAddCategory)
admin_route.post('/addCategory', adminController.addCategory)
admin_route.get('/viewCategory', auth.isAdminLogin, adminController.loadViewCategory)
admin_route.get('/edit_category', auth.isAdminLogin, adminController.loadEditCatogory)
admin_route.post('/editCategoryFetch', adminController.editCategory)
admin_route.get('/unlist_category', auth.isAdminLogin, adminController.unlistCategory)

//=============================== SalesReport related ========================================//
admin_route.get('/salesReport', auth.isAdminLogin, adminController.loadSalesReport)
admin_route.get('/exportSalesReport', auth.isAdminLogin, adminController.exportSalesReport);

//==================== product related ======================================//
admin_route.get('/addProduct', auth.isAdminLogin, productController.loadAddProduct)
admin_route.post('/addProduct', upload.array('productImage', 3), productController.addProduct)
admin_route.get('/viewProduct', auth.isAdminLogin, productController.loadViewProducts)
admin_route.get('/unlist_product', auth.isAdminLogin, productController.unlistProduct)
admin_route.get('/edit_product', auth.isAdminLogin, productController.loadEditProduct)
admin_route.post('/edit_product', upload.array('productImage', 3), productController.editProduct)
admin_route.get('/delete_product', auth.isAdminLogin, productController.deleteProduct)

//========================== order related =====================================//
admin_route.get('/orders', auth.isAdminLogin, orderController.loadAdminOrder)
admin_route.get('/manageOrder/:orderId', auth.isAdminLogin, orderController.loadManageOrder)
admin_route.post('/updateOrderStatus/:productId', orderController.updateOrderStatus);

//=============================== coupon related ========================================//
admin_route.get('/viewCoupon', auth.isAdminLogin, couponController.loadViewCoupon)
admin_route.get('/addCoupon', auth.isAdminLogin, couponController.loadAddCoupon)
admin_route.post('/addCoupon', couponController.addCoupon)
admin_route.delete('/deleteCoupon/:id', couponController.deleteCoupon)
admin_route.get('/editCoupon', auth.isAdminLogin, couponController.loadEditCoupon)
admin_route.post('/editCoupon', couponController.editCoupon)

admin_route.get('/500', auth.isAdminLogin, adminController.load500)
admin_route.get('/404', auth.isAdminLogin, adminController.load404)

admin_route.use((err, req, res, next) => {
    res.status(500).render("500");
});

admin_route.use((req, res, next) => {
    res.status(404).render("404");
})

module.exports = admin_route