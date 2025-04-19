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
      companyId:{
        type: String,
        required: true,
        immutable: true },      
      stateCode:{
        type: String,   
      },
      gstinNumber:{
        type:String
      }

})

module.exports = mongoose.model('GstinNumber',GstinNumberSchema)