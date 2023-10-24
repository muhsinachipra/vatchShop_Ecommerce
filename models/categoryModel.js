const mongoose = require("mongoose")

const categorySchema = mongoose.Schema({

    categoryName:{
        type:String,
        required:true  
    },
    categoryDescription:{
       type:String,
       required:true
    },
    isListed:{
       type:Boolean,
       default:true
    }

})

module.exports = mongoose.model('Category',categorySchema)