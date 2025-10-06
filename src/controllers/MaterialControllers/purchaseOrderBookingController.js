const PurchaseOrderBooking = require('../../models/MaterialModels/PurchaseOrderBookingModel');
const PurchaseOrder = require('../../models/MaterialModels/PurchaseOrderModel');
const { PO_BOOKING_CREATED, PO_BOOKING_CANCELLED, PO_BOOKING_DELETED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

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
        createdBy: req.admin._id,
      };

      const booking = new PurchaseOrderBooking(bookingData);
      await booking.save();

      const populatedBooking = await PurchaseOrderBooking.findById(booking._id)
        .populate('purchaseOrder', 'poCode')
        .populate('createdBy', 'name email');

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_purchaseOrderBooking,
        modelAffected: [MODEL_AFFECTED.model_PurchaseOrderBooking],
        eventType: PO_BOOKING_CREATED,
        actionDone: ACTIONS.create,
        oldData: null, // ✅ Correct for creation
        newData: booking.toObject(), // ✅ Complete snapshot
        description: `PO Booking created for amount ${bookingAmount} by ${getFullName(req.admin.employeeInfo)}`
      });

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

      // Get old data before update
      const existingRecord = await PurchaseOrderBooking.findById(bookingId);

      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      // Store original data before modification
      const originalData = existingRecord.toObject();

      // Update using save method to avoid extra DB calls
      existingRecord.status = 'cancelled';
      await existingRecord.save();

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_purchaseOrderBooking,
        modelAffected: [MODEL_AFFECTED.model_PurchaseOrderBooking],
        eventType: PO_BOOKING_CANCELLED,
        actionDone: ACTIONS.update,
        oldData: originalData, // ✅ Original data before update
        newData: existingRecord.toObject(), // ✅ Complete snapshot after update
        description: `PO Booking cancelled by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: existingRecord,
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

      // Get old data before delete
      const oldData = booking.toObject();

      // Hard delete (not soft delete)
      await PurchaseOrderBooking.findByIdAndDelete(bookingId);

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_purchaseOrderBooking,
        modelAffected: [MODEL_AFFECTED.model_PurchaseOrderBooking],
        eventType: PO_BOOKING_DELETED,
        actionDone: ACTIONS.delete,
        oldData: oldData, // ✅ Complete snapshot before delete
        newData: null, // ✅ Hard delete - null as per requirement
        description: `PO Booking deleted by ${getFullName(req.admin.employeeInfo)}`
      });

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
