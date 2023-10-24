const mongoose = require("mongoose");

const userSchema = new mongoose.Schema ({

    firstName: {
        type:String,
        required: true
    },
    lastName: {
        type:String,
        required: true
    },
    email: {
        type:String,
        required: true
    },
    mobileno: {
        type:String,
        required: true
    },
    password:{
        type:String,
        required: true
    },
    isVerified: {
        type:Boolean,
        default: false
    },
    isBlocked: {
        type:Boolean,
        default: false
    }
})

module.exports = mongoose.model('User',userSchema)