const Material = require('../../models/MaterialModels/MaterialModel');
const HSNCode = require('../../models/MaterialModels/HSNCodeModel');
const GeneralLedger = require('../../models/MaterialModels/GeneralLedgerModel');

class MaterialController {
  // Create new material
  async createMaterial(req, res) {
    try {
      const materialData = {
        ...req.body,
        createdBy: req.user.id,
      };

      // reconGL will be auto-assigned in the model pre-save middleware

      const material = new Material(materialData);
      await material.save();

      const populatedMaterial = await Material.findById(material._id)
        .populate('hsnCode', 'hsnCode description gstRate')
        .populate('supplier', 'supplierCode supplierName')
        .populate('reconGL', 'accountCode accountName')
        .populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Material created successfully',
        data: populatedMaterial,
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

  // Get all materials with pagination and filters
  async getMaterials(req, res) {
    try {
      const { page = 1, limit = 10, search, category, status, hsnCode } = req.query;

      const query = {};

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

  // Get materials by category
  async getMaterialsByCategory(req, res) {
    try {
      const { category } = req.params;
      const materials = await Material.find({
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
      const totalMaterials = await Material.countDocuments();
      const activeMaterials = await Material.countDocuments({ status: 'active' });
      const inactiveMaterials = await Material.countDocuments({ status: 'inactive' });

      // Category-wise count
      const categoryStats = await Material.aggregate([
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
