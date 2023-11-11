const mongoose = require('mongoose')

const userAddressSchema = mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  address: [
    {
      fullName: {
        type: String,
        required: true,
      },
      mobile: {
        type: Number,
        required: true,
      },
      pincode: {
        type: Number,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      district: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
    }
  ]
});


module.exports = mongoose.model('Address', userAddressSchema)