const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
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
        immutable: true 
    },   
    description:{
        type: String,
    },
    departmentCode: {
        type: String,
        required: true,
        match: /^\d{6}$/,
        immutable: true
    },
    plant:{
        type: mongoose.Schema.ObjectId, ref: 'Plant',
        immutable: true,
        required: true,
      },

})

module.exports = mongoose.model('Department',DepartmentSchema)