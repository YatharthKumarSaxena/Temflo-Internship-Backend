const VerificationConfig = require('../../models/MaterialModels/VerificationConfigModel');
const { catchErrors } = require('@/handlers/errorHandlers');
const { MAKER_CHECKER_CONFIG_CREATED, MAKER_CHECKER_CONFIG_UPDATED, VERIFICATION_CONFIG_CREATED, VERIFICATION_CONFIG_UPDATED,  VERIFICATION_CONFIG_RESET, VERIFICATION_REQUIREMENTS_UPDATED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

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
        const defaultConfig = this.getDefaultConfig(req.admin.companyId, req.admin._id);
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
        updatedBy: req.admin._id,
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
      const isNewConfig = !config.createdBy;
      if (isNewConfig) {
        config.createdBy = req.admin._id;
        await config.save();
      }

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_verificationConfig,
        modelAffected: [MODEL_AFFECTED.model_VerificationConfig],
        eventType: isNewConfig ? VERIFICATION_CONFIG_CREATED : VERIFICATION_CONFIG_UPDATED,
        actionDone: isNewConfig ? ACTIONS.create : ACTIONS.update,
        oldData: isNewConfig ? null : req.body, // ✅ Configuration data before update
        newData: config.toObject(), // ✅ Complete snapshot after update
        description: `Verification configuration ${isNewConfig ? 'created' : 'updated'} by ${getFullName(req.admin.employeeInfo)}`
      });

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
      const defaultConfig = this.getDefaultConfig(req.admin.companyId, req.admin._id);

      // Store original data before reset
      const originalConfig = await VerificationConfig.findOne({ companyId: req.admin.companyId });

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

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_verificationConfig,
        modelAffected: [MODEL_AFFECTED.model_VerificationConfig],
        eventType: VERIFICATION_CONFIG_RESET,
        actionDone: ACTIONS.update,
        oldData: originalConfig ? originalConfig.toObject() : null, // ✅ Original configuration before reset
        newData: config.toObject(), // ✅ Complete snapshot after reset
        description: `Verification configuration reset to defaults by ${getFullName(req.admin.employeeInfo)}`
      });

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
        const defaultConfig = this.getDefaultConfig(req.admin.companyId, req.admin._id);
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
          createdBy: req.admin._id,
          updatedBy: req.admin._id,
          verificationRequirements: {
            [type]: requirements,
          },
        });
        await newConfig.save();

        // ---- ACTIVITY TRACKER ----
        activityTracker({
          userId: req.admin._id,
          companyId: req.admin.companyId,
          plantId: req.admin.plantId || null,
          module: MODULE.material,
          subModuleAffected: null,
          fileAffected: FILE.file_verificationConfig,
          modelAffected: [MODEL_AFFECTED.model_VerificationConfig],
          eventType: VERIFICATION_CONFIG_CREATED,
          actionDone: ACTIONS.create,
          oldData: null, // ✅ No previous data for new config
          newData: newConfig.toObject(), // ✅ Complete snapshot of new config
          description: `Verification requirements for '${type}' created by ${getFullName(req.admin.employeeInfo)}`
        });

        return res.json({
          success: true,
          data: newConfig.verificationRequirements[type],
          message: 'Verification requirements updated successfully',
        });
      }

      // Store original data before update
      const originalData = config.toObject();

      // Update existing config
      config.verificationRequirements[type] = requirements;
      config.updatedBy = req.admin._id;
      await config.save();

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_verificationConfig,
        modelAffected: [MODEL_AFFECTED.model_VerificationConfig],
        eventType: VERIFICATION_REQUIREMENTS_UPDATED,
        actionDone: ACTIONS.update,
        oldData: originalData, // ✅ Original config before requirements update
        newData: config.toObject(), // ✅ Complete snapshot after requirements update
        description: `Verification requirements for '${type}' updated by ${getFullName(req.admin.employeeInfo)}`
      });

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
        const defaultConfig = this.getDefaultConfig(req.admin.companyId, req.admin._id);
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

      // Store original data before update
      const originalConfig = await VerificationConfig.findOne({ companyId: req.admin.companyId });
      const isNewConfig = !originalConfig;

      const config = await VerificationConfig.findOneAndUpdate(
        { companyId: req.admin.companyId },
        {
          makerCheckerConfig,
          updatedBy: req.admin._id,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_verificationConfig,
        modelAffected: [MODEL_AFFECTED.model_VerificationConfig],
        eventType: isNewConfig ? MAKER_CHECKER_CONFIG_CREATED : MAKER_CHECKER_CONFIG_UPDATED,
        actionDone: isNewConfig ? ACTIONS.create : ACTIONS.update,
        oldData: originalConfig ? originalConfig.toObject() : null, // ✅ Original config before maker-checker update
        newData: config.toObject(), // ✅ Complete snapshot after maker-checker update
        description: `Maker-checker configuration ${isNewConfig ? 'created' : 'updated'} by ${getFullName(req.admin.employeeInfo)}`
      });

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
        _id: { $ne: req.admin._id }, // Exclude current user (maker) from checker list
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
