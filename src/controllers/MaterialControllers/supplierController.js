const Supplier = require('../../models/MaterialModels/SupplierModel');
const { catchErrors } = require('@/handlers/errorHandlers');

class SupplierController {
  // Create new supplier
  async createSupplier(req, res) {
    try {
      const supplierData = {
        ...req.body,
        createdBy: req.user.id,
      };

      const supplier = new Supplier(supplierData);
      await supplier.save();

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Supplier code or GSTIN already exists',
        });
      }
      throw error;
    }
  }

  // Get all suppliers with pagination and filters
  async getSuppliers(req, res) {
    try {
      const { page = 1, limit = 10, search, status, legalStatus } = req.query;

      const query = {};

      // Search filter
      if (search) {
        query.$or = [
          { supplierName: { $regex: search, $options: 'i' } },
          { supplierCode: { $regex: search, $options: 'i' } },
          { gstin: { $regex: search, $options: 'i' } },
          { pan: { $regex: search, $options: 'i' } },
        ];
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // Legal status filter
      if (legalStatus) {
        query.legalStatus = legalStatus;
      }

      const suppliers = await Supplier.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Supplier.countDocuments(query);

      res.json({
        success: true,
        data: suppliers,
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

  // Get supplier by ID
  async getSupplierById(req, res) {
    try {
      const supplier = await Supplier.findById(req.params.id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      throw error;
    }
  }

  // Update supplier
  async updateSupplier(req, res) {
    try {
      const updateData = {
        ...req.body,
        updatedBy: req.user.id,
      };

      const supplier = await Supplier.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      res.json({
        success: true,
        message: 'Supplier updated successfully',
        data: supplier,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Supplier code or GSTIN already exists',
        });
      }
      throw error;
    }
  }

  // Delete supplier
  async deleteSupplier(req, res) {
    try {
      const supplier = await Supplier.findByIdAndDelete(req.params.id);

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      res.json({
        success: true,
        message: 'Supplier deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // Get suppliers for dropdown (active only)
  async getSuppliersDropdown(req, res) {
    try {
      const suppliers = await Supplier.find({ status: 'active' })
        .select('supplierCode supplierName gstin')
        .sort({ supplierName: 1 });

      res.json({
        success: true,
        data: suppliers,
      });
    } catch (error) {
      throw error;
    }
  }

  // Validate GSTIN
  async validateGSTIN(req, res) {
    try {
      const { gstin } = req.body;

      if (!gstin) {
        return res.status(400).json({
          success: false,
          message: 'GSTIN is required',
        });
      }

      // Basic GSTIN validation regex
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

      if (!gstinRegex.test(gstin)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid GSTIN format',
        });
      }

      // Check if GSTIN already exists
      const existingSupplier = await Supplier.findOne({ gstin });
      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: 'GSTIN already registered',
        });
      }

      res.json({
        success: true,
        message: 'GSTIN is valid',
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SupplierController();
