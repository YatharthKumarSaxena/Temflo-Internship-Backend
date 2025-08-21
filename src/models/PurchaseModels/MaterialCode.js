const mongoose = require('mongoose');

const MaterialCodeSchema = new mongoose.Schema({
  companyId: {
      type: String,
      required: true,
      immutable: true,
    },
  
    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Plant',
   },  
  code: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{6}$/, // 6-digit auto-generated code
  },
  category: {
    type: String,
    enum: ['Service', 'Material'],
    required: true,
  },
  subCategory: {
    type: String,
    enum: ['RM', 'FG', 'WIP'],
    required: function () {
      return this.category === 'Material';
    }
  },
  description: {
    type: String,
    required: true,
  },
  hsnCode: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'HSNCode',
  },
  measurement: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        if (this.category === 'Material') {
          return ['EA', 'KG', 'TO', 'QT'].includes(value);
        } else if (this.category === 'Service') {
          return ['EA', 'Hours'].includes(value);
        }
        return false;
      },
      message: props => `${props.value} is not a valid measurement unit for the selected category`
    }
  },
  reconGL: {
    type: String,
    required: true,
    // Fetched automatically from GL config
  }

}, { timestamps: true });

module.exports = mongoose.model('MaterialCode', MaterialCodeSchema);
