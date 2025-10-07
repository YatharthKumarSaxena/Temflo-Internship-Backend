const Supplier = require('../../models/MaterialModels/SupplierModel');
const { catchErrors } = require('@/handlers/errorHandlers');
const { indianStates, countries, pinCodeValidation } = require('../../config/indianStates');
const { SUPPLIER_CREATED, SUPPLIER_UPDATED, SUPPLIER_APPROVED, SUPPLIER_REJECTED, SUPPLIER_DELETED, SUPPLIER_SUBMITTED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

// Validate mandatory documents based on business rules (top-level helper to avoid `this` binding issues)
function validateMandatoryDocuments(supplierData) {
  const errors = [];

  // PAN and Bank details are mandatory for all vendors
  if (!supplierData?.documents?.panCard?.fileUrl) {
    errors.push('PAN Card document is mandatory for all vendors');
  }

  if (!supplierData?.documents?.bankDetails?.fileUrl) {
    errors.push('Bank Details document is mandatory for all vendors');
  }

  // GSTIN document is mandatory when GST is selected as Yes/Composite
  if (
    (supplierData?.gstRegistered === 'Yes' || supplierData?.gstRegistered === 'Composite') &&
    !supplierData?.documents?.gstinCertificate?.fileUrl
  ) {
    errors.push('GSTIN Certificate document is mandatory when GST Registered is Yes/Composite');
  }

  // MSME document is mandatory when MSME registration is enabled
  if (supplierData?.msmeRegistered && !supplierData?.documents?.msmeCertificate?.fileUrl) {
    errors.push('MSME Certificate document is mandatory when MSME registration is enabled');
  }

  return errors;
}

class SupplierController {
  // Create new supplier
  async createSupplier(req, res) {
    try {
      const supplierData = {
        ...req.body,
        companyId: req.admin.companyId,
        createdBy: req.admin._id,
        approvalStatus: 'draft', // Start as draft
        makerChecker: {
          maker: req.admin._id,
          allowMakerToSelectChecker: true,
        },
      };

      // If a checker comes in payload, enforce maker-checker separation
      if (
        supplierData.makerChecker?.checker &&
        supplierData.makerChecker.checker.toString() === req.admin._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Maker cannot be assigned as checker',
        });
      }

      // Validate pin code
      if (supplierData.pinCode && !pinCodeValidation.isValidPinCode(supplierData.pinCode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pin code format',
        });
      }

      // Validate mandatory documents based on business rules
      const documentValidationErrors = validateMandatoryDocuments(supplierData);
      if (documentValidationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Document validation failed',
          errors: documentValidationErrors,
        });
      }

      const supplier = new Supplier(supplierData);
      await supplier.save();

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_supplier,
        modelAffected: [MODEL_AFFECTED.model_Supplier],
        eventType: SUPPLIER_CREATED,
        actionDone: ACTIONS.create,
        oldData: null, // ✅ Correct for creation
        newData: supplier.toObject(), // ✅ Complete snapshot
        description: `Supplier '${supplier.supplierCode}' created by ${getFullName(req.admin.employeeInfo)}`
      });

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
      if (error.message.includes('Only one vendor code')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes('GSTIN digits') || error.message.includes('PAN 4th digit')) {
        return res.status(400).json({
          success: false,
          message: error.message,
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
      if (status && status !== 'all') {
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
      // Prevent updates to immutable/sensitive fields
      const {
        supplierCode, // immutable
        pan, // immutable
        tan, // immutable
        gstin, // conditionally editable based on GST status
        companyId, // controlled by server
        createdBy, // controlled by server
        makerChecker: incomingMakerChecker,
        ...rest
      } = req.body || {};

      // Get the existing supplier to check GST status
      const existingSupplier = await Supplier.findById(req.params.id);
      if (!existingSupplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      // Handle GSTIN updates based on business rules
      let allowedGstin = null;
      if (gstin !== undefined) {
        // Check if GSTIN can be updated based on original GST status
        const originalGstRegistered = existingSupplier.gstRegistered;
        const originalGstin = existingSupplier.gstin;

        // Rule: If GST was "No" at creation and no GSTIN was provided, allow updating GSTIN
        if (originalGstRegistered === 'No' && !originalGstin) {
          allowedGstin = gstin;
        }
        // Rule: If GSTIN was already provided at creation, don't allow changes
        else if (originalGstin) {
          if (gstin !== originalGstin) {
            return res.status(400).json({
              success: false,
              message: 'GSTIN cannot be modified once it has been set during creation.',
            });
          }
          allowedGstin = gstin; // Keep the same GSTIN
        }
        // Rule: If GSTIN was provided at creation with GST="No" (edge case), allow keeping it
        else if (originalGstin && originalGstRegistered === 'No') {
          allowedGstin = gstin;
        }
      }

      const updateData = {
        ...rest,
        ...(allowedGstin !== null && { gstin: allowedGstin }),
        updatedBy: req.admin._id,
      };

      // Validate mandatory documents based on business rules for updates
      const documentValidationErrors = validateMandatoryDocuments(updateData);
      if (documentValidationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Document validation failed',
          errors: documentValidationErrors,
        });
      }

      // Store original data before modification
      const originalData = existingSupplier.toObject();

      // Update using save method to avoid extra DB calls
      Object.assign(existingSupplier, updateData);
      await existingSupplier.save();

      const populatedSupplier = await Supplier.findById(existingSupplier._id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_supplier,
        modelAffected: [MODEL_AFFECTED.model_Supplier],
        eventType: SUPPLIER_UPDATED,
        actionDone: ACTIONS.update,
        oldData: originalData, // ✅ Original data before update
        newData: existingSupplier.toObject(), // ✅ Complete snapshot after update
        description: `Supplier '${existingSupplier.supplierCode}' updated by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        message: 'Supplier updated successfully',
        data: populatedSupplier,
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
      // Get old data before soft delete
      const existingSupplier = await Supplier.findById(req.params.id);

      if (!existingSupplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      // Store original data before modification
      const originalData = existingSupplier.toObject();

      // Soft-delete: mark as inactive instead of removing the document
      existingSupplier.status = 'inactive';
      await existingSupplier.save();

      // ---- ACTIVITY TRACKER ----
      // Note: Soft delete - all fields same as old data + status change
      const newData = {
        ...originalData,
        status: 'inactive'
      };

      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_supplier,
        modelAffected: [MODEL_AFFECTED.model_Supplier],
        eventType: SUPPLIER_DELETED,
        actionDone: ACTIONS.delete,
        oldData: originalData, // ✅ Complete snapshot before soft delete
        newData: { notes: "Supplier soft deleted (status changed to inactive). Rest fields same as Old Data", status: 'inactive' }, // ✅ Soft delete pattern
        description: `Supplier '${originalData.supplierCode}' soft deleted by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        message: 'Supplier inactivated successfully',
        data: existingSupplier,
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

  // Submit supplier for approval
  async submitForApproval(req, res) {
    try {
      const { id } = req.params;
      const { comments } = req.body;

      const supplier = await Supplier.findById(id);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      if (supplier.approvalStatus !== 'draft') {
        return res.status(400).json({
          success: false,
          message: 'Only draft suppliers can be submitted for approval',
        });
      }

      // Store original data before status change
      const originalData = supplier.toObject();

      supplier.approvalStatus = 'pending';
      supplier.approvalHistory.push({
        approver: req.admin._id,
        action: 'submitted',
        comments: comments || 'Submitted for approval',
        approvedAt: new Date(),
      });

      await supplier.save();

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_supplier,
        modelAffected: [MODEL_AFFECTED.model_Supplier],
        eventType: SUPPLIER_SUBMITTED,
        actionDone: ACTIONS.update,
        oldData: originalData, // ✅ Original data before status change
        newData: supplier.toObject(), // ✅ Complete snapshot after status change
        description: `Supplier '${supplier.supplierCode}' submitted for approval by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        message: 'Supplier submitted for approval successfully',
        data: supplier,
      });
    } catch (error) {
      throw error;
    }
  }

  // Approve/Reject supplier
  async approveSupplier(req, res) {
    try {
      const { id } = req.params;
      const { action, comments } = req.body;

      if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action must be either approved or rejected',
        });
      }

      const supplier = await Supplier.findById(id);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      if (supplier.approvalStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending suppliers can be approved/rejected',
        });
      }

      // If a specific checker is assigned, only that checker can act
      if (supplier.makerChecker?.checker) {
        if (supplier.makerChecker.checker.toString() !== req.admin._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Only the assigned checker can approve/reject',
          });
        }
      } else {
        // No checker assigned: ensure the approver is not the maker
        if (
          supplier.makerChecker?.maker &&
          supplier.makerChecker.maker.toString() === req.admin._id.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: 'Maker cannot approve their own supplier',
          });
        }
      }

      // Store original data before approval change
      const originalData = supplier.toObject();

      supplier.approvalStatus = action;
      supplier.approvalHistory.push({
        approver: req.admin._id,
        action,
        comments: comments || `${action} by approver`,
        approvedAt: new Date(),
      });

      await supplier.save();

      // ---- ACTIVITY TRACKER ----
      const eventType = action === 'approved' ? SUPPLIER_APPROVED : SUPPLIER_REJECTED;
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_supplier,
        modelAffected: [MODEL_AFFECTED.model_Supplier],
        eventType: eventType,
        actionDone: ACTIONS.update,
        oldData: originalData, // ✅ Original data before approval
        newData: supplier.toObject(), // ✅ Complete snapshot after approval
        description: `Supplier '${supplier.supplierCode}' ${action} by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        message: `Supplier ${action} successfully`,
        data: supplier,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get master data for dropdowns
  async getMasterData(req, res) {
    try {
      res.json({
        success: true,
        data: {
          states: indianStates,
          countries: countries,
        },
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
