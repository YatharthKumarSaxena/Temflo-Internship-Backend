const Material = require('../../models/MaterialModels/MaterialModel');
const HSNCode = require('../../models/MaterialModels/HSNCodeModel');
const GeneralLedger = require('../../models/MaterialModels/GeneralLedgerModel');

class MaterialController {
  // Create new material
  async createMaterial(req, res) {
    try {
      const materialData = {
        ...req.body,
        companyId: req.admin.companyId,
        createdBy: req.user.id,
      };

      // Enforce manual materialCode presence and format (6 alphanumeric)
      if (!materialData.materialCode || !/^[A-Za-z0-9]{6}$/.test(materialData.materialCode)) {
        return res.status(400).json({
          success: false,
          message: 'Material code is required and must be 6 letters/digits (A-Z, 0-9)'.replace(
            '..',
            '.'
          ),
        });
      }

      const maxAttempts = 3;
      let attempt = 0;
      let lastError = null;

      while (attempt < maxAttempts) {
        try {
          const material = new Material(materialData);
          await material.save();

          const populatedMaterial = await Material.findById(material._id)
            .populate('hsnCode', 'hsnCode description gstRate')
            .populate('supplier', 'supplierCode supplierName')
            .populate('reconGL', 'accountCode accountName')
            .populate('createdBy', 'name email');

          return res.status(201).json({
            success: true,
            message: 'Material created successfully',
            data: populatedMaterial,
          });
        } catch (err) {
          lastError = err;
          if (err && err.code === 11000) {
            attempt += 1;
            continue;
          }
          throw err;
        }
      }

      if (lastError) {
        if (lastError.code === 11000) {
          return res.status(400).json({
            success: false,
            message: 'Material code already exists. Please try again.',
          });
        }
        throw lastError;
      }
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Material code already exists. Please try again.',
        });
      }
      throw error;
    }
  }

  // Get all materials with pagination and filters
  async getMaterials(req, res) {
    try {
      const { page = 1, limit = 10, search, category, status, hsnCode } = req.query;

      const query = { companyId: req.admin.companyId };

      // Search filter
      if (search) {
        query.$or = [
          { materialName: { $regex: search, $options: 'i' } },
          { materialCode: { $regex: search, $options: 'i' } },
        ];
      }

      // Category filter
      if (category) {
        query.category = category;
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // HSN Code filter
      if (hsnCode) {
        query.hsnCode = hsnCode;
      }

      const materials = await Material.find(query)
        .populate('hsnCode', 'hsnCode description gstRate')
        .populate('supplier', 'supplierCode supplierName')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Material.countDocuments(query);

      res.json({
        success: true,
        data: materials,
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

  // Get material by ID
  async getMaterialById(req, res) {
    try {
      const material = await Material.findById(req.params.id)
        .populate('hsnCode', 'hsnCode description gstRate')
        .populate('supplier', 'supplierCode supplierName')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Material not found',
        });
      }

      res.json({
        success: true,
        data: material,
      });
    } catch (error) {
      throw error;
    }
  }

  // Update material
  async updateMaterial(req, res) {
    try {
      const updateData = {
        ...req.body,
        updatedBy: req.user.id,
      };

      const material = await Material.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate('hsnCode', 'hsnCode description gstRate')
        .populate('supplier', 'supplierCode supplierName')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Material not found',
        });
      }

      res.json({
        success: true,
        message: 'Material updated successfully',
        data: material,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Material code already exists',
        });
      }
      throw error;
    }
  }

  // Delete material
  async deleteMaterial(req, res) {
    try {
      const material = await Material.findByIdAndDelete(req.params.id);

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Material not found',
        });
      }

      res.json({
        success: true,
        message: 'Material deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // Get materials for dropdown (active only)
  async getMaterialsDropdown(req, res) {
    try {
      const materials = await Material.find({ companyId: req.admin.companyId, status: 'active' })
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

  // Get materials by category
  async getMaterialsByCategory(req, res) {
    try {
      const { category } = req.params;
      const materials = await Material.find({
        companyId: req.admin.companyId,
        category,
        status: 'active',
      })
        .populate('hsnCode', 'hsnCode description gstRate')
        .select('materialCode materialName measurement basicCost')
        .sort({ materialName: 1 });

      res.json({
        success: true,
        data: materials,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get material statistics
  async getMaterialStats(req, res) {
    try {
      const totalMaterials = await Material.countDocuments({ companyId: req.admin.companyId });
      const activeMaterials = await Material.countDocuments({
        companyId: req.admin.companyId,
        status: 'active',
      });
      const inactiveMaterials = await Material.countDocuments({
        companyId: req.admin.companyId,
        status: 'inactive',
      });

      // Category-wise count
      const categoryStats = await Material.aggregate([
        { $match: { companyId: req.admin.companyId } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ]);

      res.json({
        success: true,
        data: {
          total: totalMaterials,
          active: activeMaterials,
          inactive: inactiveMaterials,
          categoryStats,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Helper method to get default GL account based on category
  static async getDefaultGLAccount(category) {
    try {
      let accountName;

      if (category === 'Service') {
        accountName = 'Service Revenue';
      } else if (category === 'Material') {
        accountName = 'Inventory';
      }

      if (accountName) {
        return await GeneralLedger.findOne({
          accountName: { $regex: accountName, $options: 'i' },
          isActive: true,
        });
      }

      // Fallback to first available GL account
      return await GeneralLedger.findOne({ isActive: true });
    } catch (error) {
      console.error('Error getting default GL account:', error);
      return null;
    }
  }
}

module.exports = new MaterialController();
