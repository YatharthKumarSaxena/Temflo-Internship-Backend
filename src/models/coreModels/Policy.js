const mongoose = require('mongoose');

const PolicySchema = new mongoose.Schema({
    companyId: {
        type: String,
        required: true,
        immutable: true
      },
    plantId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Plant',
        required: function () {
          return this.role === 'employee';
        }
    },
    removed: {
    type: Boolean,
    default: false,
    },
    enabled: {
        type: Boolean,
        default: false,
    },

    policies:[
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
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the User model
            required: true
          },
          uploadedAt: {
            type: Date,
            default: Date.now // Timestamp for when the policy was uploaded
          }

        }

      ]
  
});

module.exports = mongoose.model('Policy', PolicySchema);

