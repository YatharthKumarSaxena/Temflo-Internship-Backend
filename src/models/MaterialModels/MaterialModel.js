const mongoose = require('mongoose');
const GeneralLedger = require('./GeneralLedgerModel');

// Material code must be exactly 6 alphanumeric characters (letters and/or digits)
const MATERIAL_CODE_REGEX = /^[A-Za-z0-9]{6}$/;

function generateMaterialCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  while (true) {
    let candidate = '';
    for (let index = 0; index < 6; index += 1) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      candidate += characters.charAt(randomIndex);
    }
    // Any 6-character alphanumeric is acceptable (letters-only, digits-only, or mix)
    return candidate;
  }
}

// Generate a unique material code by checking the database; retries to avoid collisions
async function generateUniqueMaterialCode(Model) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = generateMaterialCode();
    // Check DB for existing code
    // Using lean to keep it lightweight
    // Unique index is global, so we check across all docs
    const exists = await Model.findOne({ materialCode: candidate }).lean();
    if (!exists) {
      return candidate;
    }
  }
  throw new Error('Failed to generate a unique material code after multiple attempts');
}

// Expose as a model static for use outside the schema file

const materialSchema = new mongoose.Schema(
  {
    materialCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      validate: {
        validator: function (value) {
          return MATERIAL_CODE_REGEX.test(value);
        },
        message: 'Material code must be exactly 6 letters and/or digits',
      },
    },
    materialName: {
      type: String,
      required: true,
      trim: true,
    },
    hsnCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HSNCode',
      required: true,
    },
    gstRate: {
      type: Number,
      required: true,
      min: 0,
      max: 28,
    },
    category: {
      type: String,
      required: true,
      enum: ['Service', 'Material'],
    },
    subCategory: {
      type: String,
      required: function () {
        return this.category === 'Material';
      },
      enum: ['RM', 'FG', 'WIP'],
      trim: true,
    },
    measurement: {
      type: String,
      required: true,
      enum: [
        'EA',
        'KG',
        'TO',
        'QT',
        'LT',
        'MT',
        'FT',
        'M',
        'BOX',
        'PCS',
        'SET',
        'PAIR',
        'ROLL',
        'METER',
        'HOURS',
      ],
      validate: {
        validator: function (v) {
          if (this.category === 'Service') {
            return ['EA', 'HOURS'].includes(v);
          }
          return true;
        },
        message: 'For services, measurement must be either EA or HOURS',
      },
    },
    basicCost: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    specifications: {
      type: String,
      trim: true,
    },
    minimumStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    maximumStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    reorderPoint: {
      type: Number,
      default: 0,
      min: 0,
    },
    leadTime: {
      type: Number,
      default: 0,
      min: 0,
      comment: 'Lead time in days',
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    reconGL: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GeneralLedger',
      required: false, // Optional field
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    companyId: {
      type: String,
      required: true,
      immutable: true,
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

// Expose as a model static for use outside the schema file
materialSchema.statics.generateUniqueMaterialCode = async function () {
  return generateUniqueMaterialCode(this);
};

// Ensure a material code is present and unique before validation if not provided
materialSchema.pre('validate', async function (next) {
  try {
    const needsCode = !this.materialCode || !MATERIAL_CODE_REGEX.test(this.materialCode);
    if (needsCode) {
      this.materialCode = await this.constructor.generateUniqueMaterialCode();
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to validate HSN code based on category
materialSchema.pre('save', async function (next) {
  // Validate HSN code based on category
  if (this.isModified('hsnCode') || this.isModified('category')) {
    const HSNCode = mongoose.model('HSNCode');
    const hsnCode = await HSNCode.findById(this.hsnCode);

    if (hsnCode) {
      if (this.category === 'Service' && !hsnCode.hsnCode.startsWith('99')) {
        return next(new Error('For services, HSN code must start with 99'));
      }
      // if (this.category === 'Material' && hsnCode.hsnCode.startsWith('99')) {
      //   return next(new Error('For materials, HSN code must not start with 99'));
      // }
    }
  }
  next();
});

// Index for better query performance
materialSchema.index({ materialCode: 1 });
materialSchema.index({ materialName: 1 });
materialSchema.index({ hsnCode: 1 });
materialSchema.index({ category: 1 });
materialSchema.index({ status: 1 });

module.exports = mongoose.model('Material', materialSchema);
