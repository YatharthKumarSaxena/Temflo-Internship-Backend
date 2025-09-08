const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        'feature_update',
        'system_update',
        'policy_update',
        'maintenance',
        'general',
        'security',
      ],
      required: true,
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    targetUsers: {
      type: [String],
      enum: ['admin', 'owner', 'employee', 'all'],
      default: ['all'],
    },

    isRead: [
      {
        userId: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    scheduledFor: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    metadata: {
      featureId: String,
      updateVersion: String,
      actionRequired: Boolean,
      actionUrl: String,
      actionText: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
NotificationSchema.index({ companyId: 1, isActive: 1, scheduledFor: 1 });
NotificationSchema.index({ 'isRead.userId': 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
