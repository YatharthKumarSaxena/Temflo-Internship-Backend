const HSNCode = require('../../models/MaterialModels/HSNCodeModel');

class HSNController {
  // Create new HSN code
  async createHSNCode(req, res) {
    try {
      const hsnData = {
        ...req.body,
        companyId: req.admin.companyId,
        createdBy: req.user.id,
      };

      // Ensure default toDate if not provided
      if (!hsnData.toDate) {
        hsnData.toDate = new Date('9999-12-31T00:00:00.000Z');
      }

      const hsnCode = new HSNCode(hsnData);
      await hsnCode.save();

      const populatedHSN = await HSNCode.findById(hsnCode._id).populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'HSN Code created successfully',
        data: populatedHSN,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'HSN Code already exists',
        });
      }
      throw error;
    }
  }

  // Get all HSN codes with pagination and filters
  async getHSNCodes(req, res) {
    try {
      const { page = 1, limit = 10, search, category, status } = req.query;

      const query = { companyId: req.admin.companyId };

      // Search filter
      if (search) {
        query.$or = [
          { hsnCode: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
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

      const hsnCodes = await HSNCode.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ hsnCode: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await HSNCode.countDocuments(query);

      res.json({
        success: true,
        data: hsnCodes,
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

  // Get HSN code by ID
  async getHSNCodeById(req, res) {
    try {
      const hsnCode = await HSNCode.findById(req.params.id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!hsnCode) {
        return res.status(404).json({
          success: false,
          message: 'HSN Code not found',
        });
      }

      res.json({
        success: true,
        data: hsnCode,
      });
    } catch (error) {
      throw error;
    }
  }

  // Update HSN code
  async updateHSNCode(req, res) {
    try {
      const updateData = {
        ...req.body,
        updatedBy: req.user.id,
      };

      // Normalize toDate default if explicitly cleared
      if (Object.prototype.hasOwnProperty.call(req.body, 'toDate') && !req.body.toDate) {
        updateData.toDate = new Date('9999-12-31T00:00:00.000Z');
      }

      const hsnCode = await HSNCode.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!hsnCode) {
        return res.status(404).json({
          success: false,
          message: 'HSN Code not found',
        });
      }

      res.json({
        success: true,
        message: 'HSN Code updated successfully',
        data: hsnCode,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'HSN Code already exists',
        });
      }
      throw error;
    }
  }

  // Delete HSN code
  async deleteHSNCode(req, res) {
    try {
      const hsnCode = await HSNCode.findByIdAndDelete(req.params.id);

      if (!hsnCode) {
        return res.status(404).json({
          success: false,
          message: 'HSN Code not found',
        });
      }

      res.json({
        success: true,
        message: 'HSN Code deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // Get HSN codes for dropdown (active only)
  async getHSNCodesDropdown(req, res) {
    try {
      const hsnCodes = await HSNCode.find({ companyId: req.admin.companyId, status: 'active' })
        .select('hsnCode description gstRate category')
        .sort({ hsnCode: 1 });

      res.json({
        success: true,
        data: hsnCodes,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get HSN codes by category
  async getHSNCodesByCategory(req, res) {
    try {
      const { category } = req.params;
      const hsnCodes = await HSNCode.find({
        companyId: req.admin.companyId,
        category,
        status: 'active',
      })
        .select('hsnCode description gstRate')
        .sort({ hsnCode: 1 });

      res.json({
        success: true,
        data: hsnCodes,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get HSN code statistics
  async getHSNStats(req, res) {
    try {
      const totalHSNCodes = await HSNCode.countDocuments({ companyId: req.admin.companyId });
      const activeHSNCodes = await HSNCode.countDocuments({
        companyId: req.admin.companyId,
        status: 'active',
      });
      const inactiveHSNCodes = await HSNCode.countDocuments({
        companyId: req.admin.companyId,
        status: 'inactive',
      });

      // Category-wise count
      const categoryStats = await HSNCode.aggregate([
        { $match: { companyId: req.admin.companyId } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ]);

      // GST Rate-wise count
      const gstRateStats = await HSNCode.aggregate([
        { $match: { companyId: req.admin.companyId } },
        {
          $group: {
            _id: '$gstRate',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      res.json({
        success: true,
        data: {
          total: totalHSNCodes,
          active: activeHSNCodes,
          inactive: inactiveHSNCodes,
          categoryStats,
          gstRateStats,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Bulk import HSN codes
  async bulkImportHSNCodes(req, res) {
    try {
      const { hsnCodes } = req.body;

      if (!Array.isArray(hsnCodes) || hsnCodes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'HSN codes array is required',
        });
      }

      const results = [];
      const errors = [];

      for (const hsnData of hsnCodes) {
        try {
          const hsnCode = new HSNCode({
            ...hsnData,
            companyId: req.admin.companyId,
            createdBy: req.user.id,
          });
          await hsnCode.save();
          results.push(hsnCode);
        } catch (error) {
          errors.push({
            hsnCode: hsnData.hsnCode,
            error: error.message,
          });
        }
      }

      res.json({
        success: true,
        message: `Imported ${results.length} HSN codes successfully`,
        data: {
          imported: results.length,
          errors: errors.length,
          errorDetails: errors,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new HSNController();
