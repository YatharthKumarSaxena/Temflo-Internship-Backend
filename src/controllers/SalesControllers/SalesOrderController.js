const SalesOrder = require('../../models/SalesModels/SalesOrderModel');
const Customer = require('../../models/SalesModels/CustomerModel');
const Material = require('../../models/MaterialModels/MaterialModel');
const Plant = require('../../models/appModels/Plant');
const BusinessSegment = require('../../models/appModels/BusinessSegment');
const { SALES_ORDER_CREATED, SALES_ORDER_DELETED, SALES_ORDER_APPROVED, SALES_ORDER_REJECTED, SALES_ORDER_UPDATED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

class SalesOrderController {
  // Create new sales order
  async createSalesOrder(req, res) {
    try {
      // Validate line items limit
      if (req.body.lineItems && req.body.lineItems.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 50 line items allowed per sales order',
        });
      }

      // Currency is selected by user on UI; no backend restriction for Domestic

      // Financial year validation: both dates must be within same FY
      if (req.body.salesPeriodFrom && req.body.salesPeriodTo) {
        const from = new Date(req.body.salesPeriodFrom);
        const to = new Date(req.body.salesPeriodTo);
        if (to < from) {
          return res
            .status(400)
            .json({ success: false, message: 'Sales period end date must be after start date' });
        }
        const getFY = (d) => {
          const year = d.getFullYear();
          const month = d.getMonth(); // 0-based, April=3
          return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
        };
        if (getFY(from) !== getFY(to)) {
          return res.status(400).json({
            success: false,
            message: 'Sales period must be within the same financial year',
          });
        }
      }

      const salesOrderData = {
        ...req.body,
        companyId: req.admin.companyId,
        enteredBy: req.admin._id,
        status: 'pending_approval',
      };

      const salesOrder = new SalesOrder(salesOrderData);
      await salesOrder.save();

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.sales,
        subModuleAffected: null,
        fileAffected: FILE.file_salesOrder,
        modelAffected: [MODEL_AFFECTED.model_salesOrder],
        eventType: SALES_ORDER_CREATED,
        actionDone: ACTIONS.create,
        oldData: null,
        newData: salesOrder.toObject(),
        description: `Sales order '${salesOrder.orderNumber}' created by ${getFullName(req.admin.employeeInfo)}`
      });

      const populatedSO = await SalesOrder.findById(salesOrder._id)
        .populate('plant', 'plantName plantCode')
        .populate('segment', 'segmentName segmentCode')
        .populate('salesParty', 'partyName partyCode')
        .populate('billToParty', 'partyName partyCode')
        .populate('enteredBy', 'name email')
        .populate('lastChangeBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Sales Order created successfully',
        data: populatedSO,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Sales Order number already exists',
        });
      }
      throw error;
    }
  }

  // Get all sales orders with pagination and filters
  async getSalesOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        plant,
        segment,
        salesParty,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const query = { companyId: req.admin.companyId };

      // By default, exclude deleted records unless specifically requested
      const includeDeleted = req.query.includeDeleted === 'true';
      if (!includeDeleted) {
        query.deletionIndicator = { $ne: true };
      }

      // Add search filter
      if (search) {
        query.$or = [
          { salesOrderNumber: { $regex: search, $options: 'i' } },
          { 'salesParty.partyName': { $regex: search, $options: 'i' } },
          { 'billToParty.partyName': { $regex: search, $options: 'i' } },
        ];
      }

      // Add status filter
      if (status) {
        query.status = status;
      }

      // Add plant filter
      if (plant) {
        query.plant = plant;
      }

      // Add segment filter
      if (segment) {
        query.segment = segment;
      }

      // Add sales party filter
      if (salesParty) {
        query.salesParty = salesParty;
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const salesOrders = await SalesOrder.find(query)
        .populate('plant', 'plantName plantCode')
        .populate('segment', 'segmentName segmentCode')
        .populate('salesParty', 'partyName partyCode')
        .populate('billToParty', 'partyName partyCode')
        .populate('enteredBy', 'name email')
        .populate('lastChangeBy', 'name email')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalSalesOrders = await SalesOrder.countDocuments(query);

      res.json({
        success: true,
        data: salesOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSalesOrders / limit),
          totalItems: totalSalesOrders,
          itemsPerPage: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get sales order by ID
  async getSalesOrderById(req, res) {
    try {
      const salesOrder = await SalesOrder.findById(req.params.id)
        .populate('plant', 'plantName plantCode')
        .populate('segment', 'segmentName segmentCode')
        .populate('salesParty', 'partyName partyCode')
        .populate('billToParty', 'partyName partyCode')
        .populate('enteredBy', 'name email')
        .populate('lastChangeBy', 'name email');

      if (!salesOrder) {
        return res.status(404).json({
          success: false,
          message: 'Sales Order not found',
        });
      }

      res.json({
        success: true,
        data: salesOrder,
      });
    } catch (error) {
      console.error('Error fetching sales order:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Update sales order
  async updateSalesOrder(req, res) {
    try {
      // Validate line items limit
      if (req.body.lineItems && req.body.lineItems.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 50 line items allowed per sales order',
        });
      }

      // Currency is editable; no backend restriction for Domestic

      // Financial year validation on update
      if (req.body.salesPeriodFrom && req.body.salesPeriodTo) {
        const from = new Date(req.body.salesPeriodFrom);
        const to = new Date(req.body.salesPeriodTo);
        if (to < from) {
          return res
            .status(400)
            .json({ success: false, message: 'Sales period end date must be after start date' });
        }
        const getFY = (d) => {
          const year = d.getFullYear();
          const month = d.getMonth();
          return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
        };
        if (getFY(from) !== getFY(to)) {
          return res.status(400).json({
            success: false,
            message: 'Sales period must be within the same financial year',
          });
        }
      }

      // Find existing order for activity tracking
      const existingSalesOrder = await SalesOrder.findById(req.params.id);
      if (!existingSalesOrder) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found',
        });
      }

      // Store original data before update
      const originalData = existingSalesOrder.toObject();

      const updateData = {
        ...req.body,
        lastChangeBy: req.admin._id,
        lastChangeDate: new Date(),
      };

      // Remove fields that shouldn't be updated
      delete updateData.companyId;
      delete updateData.enteredBy;
      delete updateData.entryDate;

      const salesOrder = await SalesOrder.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.sales,
        subModuleAffected: null,
        fileAffected: FILE.file_salesOrder,
        modelAffected: [MODEL_AFFECTED.model_salesOrder],
        eventType: SALES_ORDER_UPDATED,
        actionDone: ACTIONS.update,
        oldData: originalData,
        newData: salesOrder.toObject(),
        description: `Sales order '${salesOrder.orderNumber}' updated by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        message: 'Sales order updated successfully',
        data: salesOrder,
      });
    } catch (error) {
      console.error('Error updating sales order:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Approve sales order
  async approveSalesOrder(req, res) {
    try {
      // Find existing order for activity tracking
      const existingSalesOrder = await SalesOrder.findById(req.params.id);
      if (!existingSalesOrder) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found',
        });
      }

      // Store original data before approval
      const originalData = existingSalesOrder.toObject();

      const salesOrder = await SalesOrder.findByIdAndUpdate(
        req.params.id,
        {
          status: 'approved',
          lastChangeBy: req.admin._id,
          lastChangeDate: new Date(),
        },
        { new: true }
      );

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.sales,
        subModuleAffected: null,
        fileAffected: FILE.file_salesOrder,
        modelAffected: [MODEL_AFFECTED.model_salesOrder],
        eventType: SALES_ORDER_APPROVED,
        actionDone: ACTIONS.update,
        oldData: originalData,
        newData: salesOrder.toObject(),
        description: `Sales order '${salesOrder.orderNumber}' approved by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        message: 'Sales order approved successfully',
        data: salesOrder,
      });
    } catch (error) {
      console.error('Error approving sales order:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Reject sales order
  async rejectSalesOrder(req, res) {
    try {
      // Find existing order for activity tracking
      const existingSalesOrder = await SalesOrder.findById(req.params.id);
      if (!existingSalesOrder) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found',
        });
      }

      // Store original data before rejection
      const originalData = existingSalesOrder.toObject();

      const salesOrder = await SalesOrder.findByIdAndUpdate(
        req.params.id,
        {
          status: 'rejected',
          rejectionReason: req.body.rejectionReason,
          lastChangeBy: req.admin._id,
          lastChangeDate: new Date(),
        },
        { new: true }
      );

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.sales,
        subModuleAffected: null,
        fileAffected: FILE.file_salesOrder,
        modelAffected: [MODEL_AFFECTED.model_salesOrder],
        eventType: SALES_ORDER_REJECTED,
        actionDone: ACTIONS.update,
        oldData: originalData,
        newData: salesOrder.toObject(),
        description: `Sales order '${salesOrder.orderNumber}' rejected by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        message: 'Sales order rejected successfully',
        data: salesOrder,
      });
    } catch (error) {
      console.error('Error rejecting sales order:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Delete sales order (soft delete)
  async deleteSalesOrder(req, res) {
    try {
      // First check if the sales order exists
      const existingSalesOrder = await SalesOrder.findById(req.params.id);

      if (!existingSalesOrder) {
        return res.status(404).json({
          success: false,
          message: 'Sales Order not found',
        });
      }

      // Check if sales order already has deletion indicator
      if (existingSalesOrder.deletionIndicator) {
        return res.status(400).json({
          success: false,
          message: 'Sales Order is already marked for deletion',
        });
      }

      const hasSalesBooked = false;

      if (hasSalesBooked) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete sales order - sales have been booked against this order',
        });
      }

      // Store original data before deletion
      const originalData = existingSalesOrder.toObject();

      // Perform soft delete
      const salesOrder = await SalesOrder.findByIdAndUpdate(
        req.params.id,
        {
          deletionIndicator: true,
          status: 'inactive',
          lastChangeBy: req.admin._id,
          lastChangeDate: new Date(),
        },
        { new: true }
      );

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.sales,
        subModuleAffected: null,
        fileAffected: FILE.file_salesOrder,
        modelAffected: [MODEL_AFFECTED.model_salesOrder],
        eventType: SALES_ORDER_DELETED,
        actionDone: ACTIONS.delete,
        oldData: originalData,
        newData: { deletionIndicator: true, status: 'inactive', lastChangeDate: salesOrder.lastChangeDate }, // Soft delete pattern
        description: `Sales order '${originalData.orderNumber}' deleted by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        message: 'Sales Order marked for deletion successfully',
        data: {
          salesOrderNumber: salesOrder.salesOrderNumber,
          deletionIndicator: salesOrder.deletionIndicator,
          status: salesOrder.status,
        },
      });
    } catch (error) {
      console.error('Error deleting sales order:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get sales order statistics
  async getSalesOrderStats(req, res) {
    try {
      const totalSalesOrders = await SalesOrder.countDocuments({ companyId: req.admin.companyId });
      const pendingApproval = await SalesOrder.countDocuments({
        companyId: req.admin.companyId,
        status: 'pending_approval',
      });
      const approved = await SalesOrder.countDocuments({
        companyId: req.admin.companyId,
        status: 'approved',
      });
      const rejected = await SalesOrder.countDocuments({
        companyId: req.admin.companyId,
        status: 'rejected',
      });

      res.json({
        success: true,
        data: {
          total: totalSalesOrders,
          pendingApproval,
          approved,
          rejected,
        },
      });
    } catch (error) {
      console.error('Error fetching sales order stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get master data for forms
  async getMasterData(req, res) {
    try {
      const [customers, plants, materials] = await Promise.all([
        Customer.find({ companyId: req.admin.companyId, status: 'active' }).select(
          'partyName partyCode'
        ),
        Plant.find({ companyId: req.admin.companyId }).select('name plantCode'),
        Material.find({ companyId: req.admin.companyId })
          .populate('hsnCode', 'hsnCode description gstRate')
          .select('materialCode materialName measurement basicCost gstRate hsnCode reconGL'),
      ]);

      res.json({
        success: true,
        data: {
          customers,
          plants,
          materials,
        },
      });
    } catch (error) {
      console.error('❌ Error fetching master data:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get segments for a specific plant
  async getSegmentsForPlant(req, res) {
    try {
      const { plantId } = req.params;

      const PlantMapping = require('../../models/appModels/PlantMapping');

      const mappings = await PlantMapping.find({
        plantId,
        enabled: true,
        companyId: req.admin.companyId,
      })
        .populate('segmentId', 'segmentCode description')
        .select('segmentId');

      const segments = mappings
        .map((m) => m.segmentId)
        .filter((segment) => segment) // Filter out null values
        .reduce((unique, segment) => {
          // Remove duplicates based on _id
          if (!unique.find((s) => s._id.toString() === segment._id.toString())) {
            unique.push(segment);
          }
          return unique;
        }, []);

      res.json({
        success: true,
        data: { segments },
      });
    } catch (error) {
      console.error('❌ Error fetching segments for plant:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

module.exports = new SalesOrderController();
