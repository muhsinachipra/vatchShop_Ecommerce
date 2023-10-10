const express = require('express')
const app = express()

const mongoose=require("mongoose")
mongoose.connect("mongodb://127.0.0.1:27017/first_project")

app.set('view engine','ejs')

PORT = 5000

const path= require("path")
app.use('/car',express.static(path.join(__dirname,'public')));

const adminRoute= require("./routes/adminRoute")
app.use('/admin',adminRoute)

app.listen(PORT,()=>{
    console.log("server started at http://localhost:5000");
})