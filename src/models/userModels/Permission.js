const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
    companyId:{
        type: String,
        required: true,
        immutable: true },
  features: [
    {
      featureName: { type: String, required: true }, // attendance_management, leave_management, etc.
      accessType: { type: String, enum: ['read', 'readWrite'], required: true }
    }
  ],
}, { timestamps: true });

permissionSchema.index({ employeeId: 1, plantId: 1 }, { unique: true });

module.exports = mongoose.model('Permission', permissionSchema);
