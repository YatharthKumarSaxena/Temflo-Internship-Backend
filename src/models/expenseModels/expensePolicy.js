const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    companyId: {
        type: String,
        required: true,
        immutable: true
      },
      plantId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Plant'
    
      },
      expensePolicies:[
        {
        category: {
            type: String,
            required: true, // Store the file path or URL (you can also manage file types here)
          },
        subCategory:[{
            type:String
        }

        ]

        }

      ],
      fields: [
        {
            id: {
              type: Number,
              required: true,
            },
            label: {
              type: String,
              required: true,
            },
            type: {
              type: String,
              required: true,
              enum: ['text', 'number', 'date', 'select', 'file'], // Allowable types
            },
            options: {
              type: [String], // For dropdown options
              default: [],
            },
            fileType: {
              type: String, // For file input types
              default: '',
            },
            required: {
              type: Boolean,
              default: false,
            },
          }
      ],
  
});

module.exports = mongoose.model('ExpensePolicy', ExpenseSchema);

