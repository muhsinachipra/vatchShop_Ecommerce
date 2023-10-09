const express = require('express')
const admin_route = express()

admin_route.set('views','./views/admin')

const adminController= require('../controllers/adminController')

admin_route.get('/',adminController.loadLogin)

module.exports =admin_route