const PurchaseOrderBooking = require('../../models/MaterialModels/PurchaseOrderBookingModel');
const PurchaseOrder = require('../../models/MaterialModels/PurchaseOrderModel');

class PurchaseOrderBookingController {
  // Create new booking for a purchase order line item
  async createBooking(req, res) {
    try {
      const { purchaseOrderId, lineItemIndex, bookingAmount, bookingType, remarks } = req.body;

      // Validate purchase order exists
      const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);
      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase Order not found',
        });
      }

      // Validate line item index
      if (lineItemIndex < 0 || lineItemIndex >= purchaseOrder.lineItems.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid line item index',
        });
      }

      const lineItem = purchaseOrder.lineItems[lineItemIndex];
      const currentNetBooking = await PurchaseOrderBooking.getNetBookingAmount(
        purchaseOrderId,
        lineItemIndex
      );
      const remainingAmount = lineItem.totalAmount - currentNetBooking;

      // Validate booking amount doesn't exceed remaining amount
      if (bookingAmount > remainingAmount) {
        return res.status(400).json({
          success: false,
          message: `Booking amount (${bookingAmount}) cannot exceed remaining amount (${remainingAmount})`,
        });
      }

      const bookingData = {
        purchaseOrder: purchaseOrderId,
        lineItemIndex,
        bookingAmount,
        bookingType,
        remarks,
        createdBy: req.user.id,
      };

      const booking = new PurchaseOrderBooking(bookingData);
      await booking.save();

      const populatedBooking = await PurchaseOrderBooking.findById(booking._id)
        .populate('purchaseOrder', 'poCode')
        .populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: populatedBooking,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get all bookings for a purchase order
  async getBookingsByPurchaseOrder(req, res) {
    try {
      const { purchaseOrderId } = req.params;

      const bookings = await PurchaseOrderBooking.find({ purchaseOrder: purchaseOrderId })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

      // Group bookings by line item index
      const bookingsByLineItem = {};
      bookings.forEach((booking) => {
        if (!bookingsByLineItem[booking.lineItemIndex]) {
          bookingsByLineItem[booking.lineItemIndex] = [];
        }
        bookingsByLineItem[booking.lineItemIndex].push(booking);
      });

      res.json({
        success: true,
        data: {
          bookings,
          bookingsByLineItem,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Get booking summary for a purchase order
  async getBookingSummary(req, res) {
    try {
      const { purchaseOrderId } = req.params;

      const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);
      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase Order not found',
        });
      }

      const summary = [];

      for (let i = 0; i < purchaseOrder.lineItems.length; i++) {
        const lineItem = purchaseOrder.lineItems[i];
        const netBookingAmount = await PurchaseOrderBooking.getNetBookingAmount(purchaseOrderId, i);
        const remainingAmount = lineItem.totalAmount - netBookingAmount;
        const canDelete = netBookingAmount === 0;

        summary.push({
          lineItemIndex: i,
          material: lineItem.material,
          totalAmount: lineItem.totalAmount,
          netBookingAmount,
          remainingAmount,
          canDelete,
          bookingPercentage:
            lineItem.totalAmount > 0 ? (netBookingAmount / lineItem.totalAmount) * 100 : 0,
        });
      }

      res.json({
        success: true,
        data: {
          purchaseOrder: {
            _id: purchaseOrder._id,
            poCode: purchaseOrder.poCode,
          },
          lineItemSummary: summary,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Cancel a booking
  async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;

      const booking = await PurchaseOrderBooking.findByIdAndUpdate(
        bookingId,
        { status: 'cancelled' },
        { new: true }
      );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: booking,
      });
    } catch (error) {
      throw error;
    }
  }

  // Delete a booking (only if status is cancelled)
  async deleteBooking(req, res) {
    try {
      const { bookingId } = req.params;

      const booking = await PurchaseOrderBooking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      if (booking.status !== 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'Only cancelled bookings can be deleted',
        });
      }

      await PurchaseOrderBooking.findByIdAndDelete(bookingId);

      res.json({
        success: true,
        message: 'Booking deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PurchaseOrderBookingController();
