const PurchaseOrder = require('../../models/MaterialModels/PurchaseOrderModel');
const Material = require('../../models/MaterialModels/MaterialModel');
const Supplier = require('../../models/MaterialModels/SupplierModel');
const PurchaseOrderBooking = require('../../models/MaterialModels/PurchaseOrderBookingModel');
const BusinessSegment = require('../../models/appModels/BusinessSegment');
const CostProfitCenter = require('../../models/appModels/CostProfitCenter');
const PlantMapping = require('../../models/appModels/PlantMapping');

class PurchaseOrderController {
  // Create new purchase order
  async createPurchaseOrder(req, res) {
    try {
      // Validate line items limit
      if (req.body.lineItems && req.body.lineItems.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 50 line items allowed per purchase order',
        });
      }

      const poData = {
        ...req.body,
        createdBy: req.user.id,
      };

      const purchaseOrder = new PurchaseOrder(poData);
      await purchaseOrder.save();

      const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
        .populate('plant', 'plantName plantCode')
        .populate('supplier', 'supplierCode supplierName')
        .populate('lineItems.material', 'materialCode materialName measurement basicCost')
        .populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Purchase Order created successfully',
        data: populatedPO,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Purchase Order code already exists',
        });
      }
      throw error;
    }
  }

  // Get all purchase orders with pagination and filters
  async getPurchaseOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        supplier,
        plant,
        startDate,
        endDate,
      } = req.query;

      const query = {};

      // Search filter
      if (search) {
        query.$or = [{ poCode: { $regex: search, $options: 'i' } }];
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // Supplier filter
      if (supplier) {
        query.supplier = supplier;
      }

      // Plant filter
      if (plant) {
        query.plant = plant;
      }

      // Date range filter
      if (startDate || endDate) {
        query['purchasePeriod.startDate'] = {};
        if (startDate) {
          query['purchasePeriod.startDate'].$gte = new Date(startDate);
        }
        if (endDate) {
          query['purchasePeriod.endDate'].$lte = new Date(endDate);
        }
      }

      const purchaseOrders = await PurchaseOrder.find(query)
        .populate('plant', 'plantName plantCode')
        .populate('supplier', 'supplierCode supplierName')
        .populate('lineItems.material', 'materialCode materialName')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('approvalHistory.approver', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await PurchaseOrder.countDocuments(query);

      res.json({
        success: true,
        data: purchaseOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Get purchase order by ID
  async getPurchaseOrderById(req, res) {
    try {
      const purchaseOrder = await PurchaseOrder.findById(req.params.id)
        .populate('plant', 'plantName plantCode')
        .populate('supplier', 'supplierCode supplierName')
        .populate('lineItems.material', 'materialCode materialName measurement basicCost')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('approvalHistory.approver', 'name email');

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase Order not found',
        });
      }

      res.json({
        success: true,
        data: purchaseOrder,
      });
    } catch (error) {
      throw error;
    }
  }

  // Update purchase order
  async updatePurchaseOrder(req, res) {
    try {
      // Validate line items limit
      if (req.body.lineItems && req.body.lineItems.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 50 line items allowed per purchase order',
        });
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user.id,
      };

      // If line items are being updated, validate deletion rules
      if (updateData.lineItems) {
        const originalPO = await PurchaseOrder.findById(req.params.id);
        if (originalPO) {
          const validationResult = await this.validateLineItemDeletion(
            originalPO,
            updateData.lineItems
          );
          if (!validationResult.canUpdate) {
            return res.status(400).json({
              success: false,
              message: validationResult.message,
              details: validationResult.details,
            });
          }
        }
      }

      const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate('plant', 'plantName plantCode')
        .populate('supplier', 'supplierCode supplierName')
        .populate('lineItems.material', 'materialCode materialName measurement basicCost')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('approvalHistory.approver', 'name email');

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase Order not found',
        });
      }

      res.json({
        success: true,
        message: 'Purchase Order updated successfully',
        data: purchaseOrder,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Purchase Order code already exists',
        });
      }
      throw error;
    }
  }

  // Validate line item deletion based on booking rules
  async validateLineItemDeletion(originalPO, newLineItems) {
    const originalLineItemCount = originalPO.lineItems.length;
    const newLineItemCount = newLineItems.length;

    // If no line items were removed, no validation needed
    if (newLineItemCount >= originalLineItemCount) {
      return { canUpdate: true };
    }

    const removedLineItems = [];
    const errors = [];

    // Check which line items were removed
    for (let i = 0; i < originalLineItemCount; i++) {
      const originalItem = originalPO.lineItems[i];
      const stillExists = newLineItems.some(
        (newItem) =>
          newItem.material?.toString() === originalItem.material?.toString() &&
          newItem.quantity === originalItem.quantity &&
          newItem.basicCost === originalItem.basicCost
      );

      if (!stillExists) {
        removedLineItems.push(i);
      }
    }

    // Validate each removed line item
    for (const lineItemIndex of removedLineItems) {
      const canDelete = await PurchaseOrderBooking.canDeleteLineItem(originalPO._id, lineItemIndex);
      if (!canDelete) {
        const netBookingAmount = await PurchaseOrderBooking.getNetBookingAmount(
          originalPO._id,
          lineItemIndex
        );
        const lineItem = originalPO.lineItems[lineItemIndex];
        errors.push({
          lineItemIndex,
          material: lineItem.material,
          netBookingAmount,
          message: `Cannot delete line item ${
            lineItemIndex + 1
          }. Net booking amount (${netBookingAmount}) is greater than 0.`,
        });
      }
    }

    if (errors.length > 0) {
      return {
        canUpdate: false,
        message: 'Cannot delete line items with existing bookings',
        details: errors,
      };
    }

    return { canUpdate: true };
  }

  // Delete purchase order
  async deletePurchaseOrder(req, res) {
    try {
      const purchaseOrder = await PurchaseOrder.findByIdAndDelete(req.params.id);

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase Order not found',
        });
      }

      res.json({
        success: true,
        message: 'Purchase Order deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // Submit purchase order for approval
  async submitForApproval(req, res) {
    try {
      const purchaseOrder = await PurchaseOrder.findById(req.params.id);

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase Order not found',
        });
      }

      if (purchaseOrder.status !== 'draft') {
        return res.status(400).json({
          success: false,
          message: 'Only draft purchase orders can be submitted for approval',
        });
      }

      purchaseOrder.status = 'pending';
      await purchaseOrder.save();

      const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
        .populate('plant', 'plantName plantCode')
        .populate('supplier', 'supplierCode supplierName')
        .populate('lineItems.material', 'materialCode materialName measurement basicCost')
        .populate('createdBy', 'name email');

      res.json({
        success: true,
        message: 'Purchase Order submitted for approval successfully',
        data: populatedPO,
      });
    } catch (error) {
      throw error;
    }
  }

  // Approve/Reject purchase order
  async approvePurchaseOrder(req, res) {
    try {
      const { action, comments } = req.body;
      const { id } = req.params;

      if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action must be either approved or rejected',
        });
      }

      const purchaseOrder = await PurchaseOrder.findById(id);

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase Order not found',
        });
      }

      if (purchaseOrder.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending purchase orders can be approved/rejected',
        });
      }

      // Add approval history
      purchaseOrder.approvalHistory.push({
        approver: req.user.id,
        action,
        comments,
        approvedAt: new Date(),
      });

      purchaseOrder.status = action;
      await purchaseOrder.save();

      const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
        .populate('plant', 'plantName plantCode')
        .populate('supplier', 'supplierCode supplierName')
        .populate('lineItems.material', 'materialCode materialName measurement basicCost')
        .populate('createdBy', 'name email')
        .populate('approvalHistory.approver', 'name email');

      res.json({
        success: true,
        message: `Purchase Order ${action} successfully`,
        data: populatedPO,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get segments and cost centres for a specific plant
  async getPlantMappings(req, res) {
    try {
      const { plantId } = req.params;

      const mappings = await PlantMapping.find({ plantId, enabled: true })
        .populate('segmentId', 'segmentCode description')
        .populate('costCentreId', 'costProfitCode description');

      const segments = [...new Set(mappings.map((m) => m.segmentId))];
      const costCentres = [...new Set(mappings.map((m) => m.costCentreId))];

      res.json({
        success: true,
        data: {
          segments,
          costCentres,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Get cost centres for a specific plant and segment combination
  async getCostCentresForPlantSegment(req, res) {
    try {
      const { plantId, segmentId } = req.params;

      const mappings = await PlantMapping.find({
        plantId,
        segmentId,
        enabled: true,
      }).populate('costCentreId', 'costProfitCode description');

      const costCentres = mappings.map((m) => m.costCentreId);

      res.json({
        success: true,
        data: costCentres,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get pending purchase orders for approvers
  async getPendingPurchaseOrders(req, res) {
    try {
      const purchaseOrders = await PurchaseOrder.find({ status: 'pending' })
        .populate('plant', 'plantName plantCode')
        .populate('supplier', 'supplierCode supplierName')
        .populate('lineItems.material', 'materialCode materialName')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: purchaseOrders,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get purchase order statistics
  async getPurchaseOrderStats(req, res) {
    try {
      const totalPOs = await PurchaseOrder.countDocuments();
      const draftPOs = await PurchaseOrder.countDocuments({ status: 'draft' });
      const pendingPOs = await PurchaseOrder.countDocuments({ status: 'pending' });
      const approvedPOs = await PurchaseOrder.countDocuments({ status: 'approved' });
      const rejectedPOs = await PurchaseOrder.countDocuments({ status: 'rejected' });

      // Status-wise count
      const statusStats = await PurchaseOrder.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      // Monthly PO creation trend
      const monthlyStats = await PurchaseOrder.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 },
        },
      ]);

      res.json({
        success: true,
        data: {
          total: totalPOs,
          draft: draftPOs,
          pending: pendingPOs,
          approved: approvedPOs,
          rejected: rejectedPOs,
          statusStats,
          monthlyStats,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Get materials for PO line items
  async getMaterialsForPO(req, res) {
    try {
      const materials = await Material.find({ status: 'active' })
        .populate('hsnCode', 'hsnCode description gstRate')
        .select('materialCode materialName category measurement basicCost')
        .sort({ materialName: 1 });

      res.json({
        success: true,
        data: materials,
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PurchaseOrderController();
