const mongoose = require('mongoose');

const BusinessAreaSchema = new mongoose.Schema({
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
        
      businessArea:{
        type: String,
        // required: true,
        match: /^\d{4}$/, // 4 digit code
        immutable: true ,  // Not editable
            
      },
      description:{
        type: String,

      },
      stateCode:{
        type: String,
        immutable: true ,  // Not editable
        
      }

})

module.exports = mongoose.model('BusinessArea',BusinessAreaSchema)