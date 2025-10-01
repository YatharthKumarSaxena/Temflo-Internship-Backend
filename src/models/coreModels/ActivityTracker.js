const mongoose = require('mongoose');
const EVENT_TYPE = require('@/config/activity.enums');
const { MODULE, MODEL_AFFECTED, SUBMODULE, FILE, ACTIONS } = require('@/config/structure.config');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  companyId: {
    type: String,
    required: true,
  },
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant',
    required: false,
    default: null
  },
  module: {
    type: String,
    enum: Object.values(MODULE),
    required: true,
  },
  fileAffected: {
    type: String,
    enum: Object.values(FILE),
    required: true,
  },
  subModuleAffected: {
    type: String,
    enum: Object.values(SUBMODULE),
    required: false,
    default: null
  },
  modelAffected: {
    type: [String],
    enum: Object.values(MODEL_AFFECTED),
    required: true,
  },
  eventType: {
    type: String,
    enum: Object.values(EVENT_TYPE), // create, update, delete
    required: true,
  },
  actionDone: {
    type: String,
    enum: Object.values(ACTIONS),
    required: true,
  },

  // Optional for update/delete
  oldData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  newData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },

  // ✅ New field to store user snapshot
  userSnapshot: {
    name: { type: String, default: null },
    email: { type: String, default: null },
    employeeCode: { type: String, default: null },
  },

  // Optional description field
  description: {
    type: String,
    default: null,
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Activity = mongoose.model('ActivityTracker', activitySchema);
module.exports = Activity;
