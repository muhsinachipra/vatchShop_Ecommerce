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
admin_route.get('/',auth.isLogout,adminController.loadLogin)
admin_route.post('/',adminController.verifyLogin)

module.exports =admin_route