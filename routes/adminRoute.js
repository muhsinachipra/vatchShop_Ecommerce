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
        cb(null, path.join(__dirname, '../public/adminAssets/assets/images/products'));
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

admin_route.get('/', auth.isAdminLogout, adminController.loadLogin)
admin_route.post('/', adminController.verifyLogin)
admin_route.get('/dashboard', auth.isAdminLogin, adminController.loadDashboard)
admin_route.get('/Users', auth.isAdminLogin, adminController.loadUsers)
admin_route.get('/block_users', auth.isAdminLogin, adminController.blockUser)
admin_route.get('/addCategory', auth.isAdminLogin, adminController.loadAddCategory)
admin_route.post('/addCategory', adminController.addCategory)
admin_route.get('/viewCategory', auth.isAdminLogin, adminController.loadViewCategory)
admin_route.get('/edit_category', auth.isAdminLogin, adminController.loadEditCatogory)
admin_route.post('/edit_category', adminController.editCategory)
admin_route.get('/unlist_category', auth.isAdminLogin, adminController.unlistCategory)
admin_route.get('/addProduct', auth.isAdminLogin, productController.loadAddProduct)
admin_route.post('/addProduct', upload.array('productImage', 3), productController.addProduct)
admin_route.get('/viewProduct', auth.isAdminLogin, productController.loadViewProducts)
admin_route.get('/unlist_product', auth.isAdminLogin, productController.unlistProduct)
admin_route.get('/edit_product', auth.isAdminLogin, productController.loadEditProduct)
admin_route.post('/edit_product', upload.array('productImage', 3), productController.editProduct)



module.exports = admin_route