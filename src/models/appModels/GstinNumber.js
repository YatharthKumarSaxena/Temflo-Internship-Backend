const mongoose = require('mongoose');

const GstinNumberSchema = new mongoose.Schema({
    removed: {
        type: Boolean,
        default: false,
      },
      enabled: {
        type: Boolean,
        default: true,
      },
      company:{type: mongoose.Schema.ObjectId, ref: 'Admin' },
      
      stateCode:{
        type: String,   
      },
      gstinNumber:{
        type:String
      }

})

module.exports = mongoose.model('GstinNumber',GstinNumberSchema)