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

const path= require("path")

const userController = require("../controllers/userController");

user_route.get('/',auth.isLogout,userController.loginLoad)
user_route.post('/',userController.verifyLogin)
user_route.post('/#up',userController.insertUser);

module.exports=user_route