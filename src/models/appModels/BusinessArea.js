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
      company:{type: mongoose.Schema.ObjectId, ref: 'Admin' },
      businessArea:{
        type: String,
        // required: true,
        match: /^\d{4}$/, // 4 digit code
        immutable: true ,  // Not editable
        unique: true    
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