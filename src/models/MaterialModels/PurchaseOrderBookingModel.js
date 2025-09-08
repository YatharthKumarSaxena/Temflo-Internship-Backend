const mongoose = require('mongoose');

const purchaseOrderBookingSchema = new mongoose.Schema(
  {
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
    },
    lineItemIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    bookingType: {
      type: String,
      required: true,
      enum: ['partial', 'full'],
    },
    remarks: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
purchaseOrderBookingSchema.index({ purchaseOrder: 1, lineItemIndex: 1 });
purchaseOrderBookingSchema.index({ bookingDate: -1 });

// Virtual to calculate net booking amount for a line item
purchaseOrderBookingSchema.virtual('netBookingAmount').get(function () {
  return this.status === 'active' ? this.bookingAmount : 0;
});

// Static method to get net booking amount for a specific line item
purchaseOrderBookingSchema.statics.getNetBookingAmount = async function (
  purchaseOrderId,
  lineItemIndex
) {
  const bookings = await this.find({
    purchaseOrder: purchaseOrderId,
    lineItemIndex: lineItemIndex,
    status: 'active',
  });

  return bookings.reduce((total, booking) => total + booking.bookingAmount, 0);
};

// Static method to check if line item can be deleted
purchaseOrderBookingSchema.statics.canDeleteLineItem = async function (
  purchaseOrderId,
  lineItemIndex
) {
  const netBookingAmount = await this.getNetBookingAmount(purchaseOrderId, lineItemIndex);
  return netBookingAmount === 0;
};

module.exports = mongoose.model('PurchaseOrderBooking', purchaseOrderBookingSchema);
