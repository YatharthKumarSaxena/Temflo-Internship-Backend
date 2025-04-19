const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  plantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  accessType: { type: String, enum: ['read', 'readWrite'], required: true }
}, { _id: false });

const roleSchema = new mongoose.Schema({
  roleId: { type: String, unique: true, required: true },
  roleName: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }, // Owner ID
  permissions: [permissionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
