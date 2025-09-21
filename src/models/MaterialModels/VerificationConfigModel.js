const mongoose = require('mongoose');

const verificationConfigSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      immutable: true,
    },

    // Individual verification requirements
    verificationRequirements: {
      pan: {
        required: {
          type: Boolean,
          default: true,
        },
        autoVerify: {
          type: Boolean,
          default: true,
        },
        allowManualOverride: {
          type: Boolean,
          default: true,
        },
      },
      tan: {
        required: {
          type: Boolean,
          default: false,
        },
        autoVerify: {
          type: Boolean,
          default: true,
        },
        allowManualOverride: {
          type: Boolean,
          default: true,
        },
      },
      gstin: {
        required: {
          type: Boolean,
          default: true,
        },
        autoVerify: {
          type: Boolean,
          default: true,
        },
        allowManualOverride: {
          type: Boolean,
          default: true,
        },
      },
      msme: {
        required: {
          type: Boolean,
          default: false,
        },
        autoVerify: {
          type: Boolean,
          default: true,
        },
        allowManualOverride: {
          type: Boolean,
          default: true,
        },
      },
      bankAccount: {
        required: {
          type: Boolean,
          default: true,
        },
        autoVerify: {
          type: Boolean,
          default: true,
        },
        allowManualOverride: {
          type: Boolean,
          default: true,
        },
      },
    },

    // Maker-Checker configuration
    makerCheckerConfig: {
      enabled: {
        type: Boolean,
        default: true,
      },
      allowMakerToSelectChecker: {
        type: Boolean,
        default: true,
      },
      defaultCheckerRole: {
        type: String,
        enum: ['admin', 'manager', 'supervisor'],
        default: 'manager',
      },
      requireCheckerApproval: {
        type: Boolean,
        default: true,
      },
      autoApproveAfterDays: {
        type: Number,
        default: 7, // Auto-approve after 7 days if no checker action
      },
    },

    // Verification workflow settings
    workflowSettings: {
      allowDraftMode: {
        type: Boolean,
        default: true,
      },
      requireAllVerifications: {
        type: Boolean,
        default: false, // Allow partial verification
      },
      verificationExpiryDays: {
        type: Number,
        default: 365, // Verification valid for 1 year
      },
      allowReVerification: {
        type: Boolean,
        default: true,
      },
    },

    // Notification settings
    notificationSettings: {
      notifyOnVerificationFailure: {
        type: Boolean,
        default: true,
      },
      notifyCheckerOnSubmission: {
        type: Boolean,
        default: true,
      },
      notifyMakerOnApproval: {
        type: Boolean,
        default: true,
      },
      notifyMakerOnRejection: {
        type: Boolean,
        default: true,
      },
    },

    // API configuration
    apiConfig: {
      useMockApis: {
        type: Boolean,
        default: true, // Use mock APIs for development
      },
      apiTimeout: {
        type: Number,
        default: 10000, // 10 seconds
      },
      maxRetries: {
        type: Number,
        default: 3,
      },
      retryDelay: {
        type: Number,
        default: 1000, // 1 second
      },
    },

    // Status and metadata
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one configuration per company
verificationConfigSchema.index({ companyId: 1 }, { unique: true });

// Index for better query performance
verificationConfigSchema.index({ status: 1 });
verificationConfigSchema.index({ createdAt: -1 });

module.exports = mongoose.model('VerificationConfig', verificationConfigSchema);
