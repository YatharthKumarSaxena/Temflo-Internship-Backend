const mongoose = require('mongoose');

const PlantMappingSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  companyId: {
    type: String,
    required: true,
    immutable: true,
  },
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant',
    required: true,
  },
  segmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessSegment',
    required: true,
  },
  costCentreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CostProfitCenter',
    required: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique combination of plant, segment, and cost centre
PlantMappingSchema.index({ plantId: 1, segmentId: 1, costCentreId: 1 }, { unique: true });
PlantMappingSchema.index({ companyId: 1 });

module.exports = mongoose.model('PlantMapping', PlantMappingSchema);
