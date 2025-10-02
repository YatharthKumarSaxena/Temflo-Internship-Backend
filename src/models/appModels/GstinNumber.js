const mongoose = require('mongoose');

const GstinNumberSchema = new mongoose.Schema({
    removed: {
        type: Boolean,
        default: false,
      },
      companyId:{
        type: String,
        required: true,
        immutable: true },      
      stateCode:{
        type: String, 
        required:true  
      },
      stateName:{
        type: String, 
        required:true
      },
      gstinNumber:{
        type:String,
        required:true
      }

})

module.exports = mongoose.model('GstinNumber',GstinNumberSchema)