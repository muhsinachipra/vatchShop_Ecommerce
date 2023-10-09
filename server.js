const express = require('express')
const app = express()

app.set('view engine','ejs')

PORT = 5000

const adminRoute= require("./routes/adminRoute")
app.use('/admin',adminRoute)

app.listen(PORT,()=>{
    console.log("server started at http://localhost:5000");
})