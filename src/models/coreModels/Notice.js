const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
    companyId: {
        type: String,
        required: true,
        immutable: true
      },
    
    enabled: {
        type: Boolean,
        default: false,
    },

    notices:[
        {
          file: {
            type: String,
            required: true, // Store the file path or URL (you can also manage file types here)
          },
          description: {
            type: String,
            required: true, // Policy description
          },
          publishedDate: {
            type: Date,
            required: true, // Published date of the policy
          },
          uploadedAt: {
            type: Date,
            default: Date.now // Timestamp for when the policy was uploaded
          }


        }

      ]
  
});

module.exports = mongoose.model('Notice', NoticeSchema);

