const express = require('express')
const admin_route = express()

const session = require('express-session')
const config= require('../config/config')
admin_route.use(session({secret:config.sessionSecret,resave:false,saveUninitialized:true}))

const auth = require('../middleware/adminAuth')

const bodyParser = require('body-parser')
admin_route.use(bodyParser.json())
admin_route.use(bodyParser.urlencoded({extended:true}))

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')

const adminController= require('../controllers/adminController')

admin_route.get('/',auth.isAdminLogout,adminController.loadLogin)
admin_route.post('/',adminController.verifyLogin)
admin_route.get('/dashboard',auth.isAdminLogin,adminController.loadDashboard)
admin_route.get('/Users',auth.isAdminLogin,adminController.loadUsers)
admin_route.get('/block_users',auth.isAdminLogin,adminController.blockUser)
admin_route.get('/addCategory',auth.isAdminLogin,adminController.loadAddCategory)
admin_route.post('/addCategory',adminController.addCategory)
admin_route.get('/viewCategory',auth.isAdminLogin,adminController.loadViewCategory)
admin_route.get('/edit_category',auth.isAdminLogin,adminController.loadEditCatogory)
admin_route.post('/edit_category',adminController.editCategory)
admin_route.get('/unlist_category',auth.isAdminLogin,adminController.unlistCategory)



module.exports =admin_route