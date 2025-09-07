const TDSCode = require('../../models/MaterialModels/TDSCodeModel');
const { catchErrors } = require('@/handlers/errorHandlers');

class TDSController {
  // Get all TDS codes with pagination and filters
  async getTDSCodes(req, res) {
    try {
      const { page = 1, limit = 10, search, category, status } = req.query;
      const skip = (page - 1) * limit;

      let query = {};

      if (search) {
        query.$or = [
          { tdsCode: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { section: { $regex: search, $options: 'i' } },
        ];
      }

      if (category) {
        query.category = category;
      }

      if (status) {
        query.status = status;
      }

      const tdsCodes = await TDSCode.find(query)
        .sort({ tdsCode: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      const total = await TDSCode.countDocuments(query);

      res.json({
        success: true,
        data: tdsCodes,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Get TDS code by ID
  async getTDSCodeById(req, res) {
    try {
      const { id } = req.params;
      const tdsCode = await TDSCode.findById(id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!tdsCode) {
        return res.status(404).json({
          success: false,
          message: 'TDS Code not found',
        });
      }

      res.json({
        success: true,
        data: tdsCode,
      });
    } catch (error) {
      throw error;
    }
  }

  // Create new TDS code
  async createTDSCode(req, res) {
    try {
      const tdsCodeData = {
        ...req.body,
        createdBy: req.user.id,
      };

      const tdsCode = new TDSCode(tdsCodeData);
      await tdsCode.save();

      res.status(201).json({
        success: true,
        message: 'TDS Code created successfully',
        data: tdsCode,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'TDS Code already exists',
        });
      }
      throw error;
    }
  }

  // Update TDS code
  async updateTDSCode(req, res) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user.id,
      };

      const tdsCode = await TDSCode.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!tdsCode) {
        return res.status(404).json({
          success: false,
          message: 'TDS Code not found',
        });
      }

      res.json({
        success: true,
        message: 'TDS Code updated successfully',
        data: tdsCode,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'TDS Code already exists',
        });
      }
      throw error;
    }
  }

  // Delete TDS code
  async deleteTDSCode(req, res) {
    try {
      const { id } = req.params;
      const tdsCode = await TDSCode.findByIdAndDelete(id);

      if (!tdsCode) {
        return res.status(404).json({
          success: false,
          message: 'TDS Code not found',
        });
      }

      res.json({
        success: true,
        message: 'TDS Code deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // Get TDS codes dropdown
  async getTDSCodesDropdown(req, res) {
    try {
      const tdsCodes = await TDSCode.find({ status: 'active' })
        .select('tdsCode description tdsRate section category')
        .sort({ tdsCode: 1 });

      res.json({
        success: true,
        data: tdsCodes,
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TDSController();
