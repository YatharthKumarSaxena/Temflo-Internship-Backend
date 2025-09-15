const VerificationConfig = require('../../models/MaterialModels/VerificationConfigModel');
const { catchErrors } = require('@/handlers/errorHandlers');

class VerificationConfigController {
  /**
   * Get verification configuration for the company
   */
  getVerificationConfig = async (req, res) => {
    try {
      const config = await VerificationConfig.findOne({
        companyId: req.admin.companyId,
        status: 'active',
      })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!config) {
        // Return default configuration if none exists
        const defaultConfig = this.getDefaultConfig(req.admin.companyId, req.user.id);
        return res.json({
          success: true,
          data: defaultConfig,
          message: 'Using default verification configuration',
        });
      }

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Create or update verification configuration
   */
  updateVerificationConfig = async (req, res) => {
    try {
      const configData = {
        ...req.body,
        companyId: req.admin.companyId,
        updatedBy: req.user.id,
      };

      // Remove fields that shouldn't be updated
      delete configData._id;
      delete configData.createdAt;
      delete configData.createdBy;

      const config = await VerificationConfig.findOneAndUpdate(
        { companyId: req.admin.companyId },
        configData,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );

      // If this is a new config, set the createdBy field
      if (!config.createdBy) {
        config.createdBy = req.user.id;
        await config.save();
      }

      res.json({
        success: true,
        data: config,
        message: 'Verification configuration updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Reset verification configuration to defaults
   */
  resetVerificationConfig = async (req, res) => {
    try {
      const defaultConfig = this.getDefaultConfig(req.admin.companyId, req.user.id);

      const config = await VerificationConfig.findOneAndUpdate(
        { companyId: req.admin.companyId },
        defaultConfig,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );

      res.json({
        success: true,
        data: config,
        message: 'Verification configuration reset to defaults',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get verification requirements for a specific type
   */
  getVerificationRequirements = async (req, res) => {
    try {
      const { type } = req.params;

      const config = await VerificationConfig.findOne({
        companyId: req.admin.companyId,
        status: 'active',
      });

      if (!config) {
        const defaultConfig = this.getDefaultConfig(req.admin.companyId, req.user.id);
        return res.json({
          success: true,
          data: defaultConfig.verificationRequirements[type] || null,
        });
      }

      res.json({
        success: true,
        data: config.verificationRequirements[type] || null,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Update verification requirements for a specific type
   */
  updateVerificationRequirements = async (req, res) => {
    try {
      const { type } = req.params;
      const requirements = req.body;

      const config = await VerificationConfig.findOne({
        companyId: req.admin.companyId,
      });

      if (!config) {
        // Create new config with this requirement
        const newConfig = new VerificationConfig({
          companyId: req.admin.companyId,
          createdBy: req.user.id,
          updatedBy: req.user.id,
          verificationRequirements: {
            [type]: requirements,
          },
        });
        await newConfig.save();

        return res.json({
          success: true,
          data: newConfig.verificationRequirements[type],
          message: 'Verification requirements updated successfully',
        });
      }

      // Update existing config
      config.verificationRequirements[type] = requirements;
      config.updatedBy = req.user.id;
      await config.save();

      res.json({
        success: true,
        data: config.verificationRequirements[type],
        message: 'Verification requirements updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get maker-checker configuration
   */
  getMakerCheckerConfig = async (req, res) => {
    try {
      const config = await VerificationConfig.findOne({
        companyId: req.admin.companyId,
        status: 'active',
      });

      if (!config) {
        const defaultConfig = this.getDefaultConfig(req.admin.companyId, req.user.id);
        return res.json({
          success: true,
          data: defaultConfig.makerCheckerConfig,
        });
      }

      res.json({
        success: true,
        data: config.makerCheckerConfig,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Update maker-checker configuration
   */
  updateMakerCheckerConfig = async (req, res) => {
    try {
      const makerCheckerConfig = req.body;

      const config = await VerificationConfig.findOneAndUpdate(
        { companyId: req.admin.companyId },
        {
          makerCheckerConfig,
          updatedBy: req.user.id,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );

      res.json({
        success: true,
        data: config.makerCheckerConfig,
        message: 'Maker-checker configuration updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get available checker users for the company
   */
  getAvailableCheckers = async (req, res) => {
    try {
      const User = require('../../models/userModels/User');

      // Get all active employees for the company
      const checkers = await User.find({
        companyId: req.admin.companyId,
        status: 'active',
        _id: { $ne: req.user.id }, // Exclude current user (maker) from checker list
      })
        .select('_id name email role department')
        .sort({ name: 1 });

      res.json({
        success: true,
        data: checkers,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get default verification configuration
   */
  getDefaultConfig(companyId, userId) {
    return {
      companyId,
      verificationRequirements: {
        pan: {
          required: true,
          autoVerify: true,
          allowManualOverride: true,
        },
        tan: {
          required: false,
          autoVerify: true,
          allowManualOverride: true,
        },
        gstin: {
          required: true,
          autoVerify: true,
          allowManualOverride: true,
        },
        msme: {
          required: false,
          autoVerify: true,
          allowManualOverride: true,
        },
        bankAccount: {
          required: true,
          autoVerify: true,
          allowManualOverride: true,
        },
      },
      makerCheckerConfig: {
        enabled: true,
        allowMakerToSelectChecker: true,
        defaultCheckerRole: 'manager',
        requireCheckerApproval: true,
        autoApproveAfterDays: 7,
      },
      workflowSettings: {
        allowDraftMode: true,
        requireAllVerifications: false,
        verificationExpiryDays: 365,
        allowReVerification: true,
      },
      notificationSettings: {
        notifyOnVerificationFailure: true,
        notifyCheckerOnSubmission: true,
        notifyMakerOnApproval: true,
        notifyMakerOnRejection: true,
      },
      apiConfig: {
        useMockApis: true,
        apiTimeout: 10000,
        maxRetries: 3,
        retryDelay: 1000,
      },
      status: 'active',
      createdBy: userId,
    };
  }
}

module.exports = new VerificationConfigController();
