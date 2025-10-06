const VerificationConfig = require('../../models/MaterialModels/VerificationConfigModel');
const { catchErrors } = require('@/handlers/errorHandlers');
const { SALES_VERIFICATION_CONFIG_CREATED, SALES_VERIFICATION_CONFIG_UPDATED, SALES_MAKER_CHECKER_CONFIG_CREATED, SALES_MAKER_CHECKER_CONFIG_UPDATED, SALES_NOTIFICATION_SETTINGS_CREATED, SALES_NOTIFICATION_SETTINGS_UPDATED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

class SalesVerificationConfigController {
  // Get full verification configuration
  getVerificationConfig = async (req, res) => {
    try {
      const config = await VerificationConfig.findOne({
        companyId: req.admin.companyId,
        status: 'active',
      });

      if (!config) {
        return res.json({
          success: true,
          data: this.getDefaultConfig(req.admin.companyId, req.admin._id),
        });
      }

      res.json({ success: true, data: config });
    } catch (error) {
      throw error;
    }
  };

  // Maker-checker config
  getMakerCheckerConfig = async (req, res) => {
    try {
      const config = await VerificationConfig.findOne({
        companyId: req.admin.companyId,
        status: 'active',
      });
      if (!config) {
        return res.json({
          success: true,
          data: this.getDefaultConfig(req.admin.companyId, req.admin._id).makerCheckerConfig,
        });
      }
      res.json({ success: true, data: config.makerCheckerConfig });
    } catch (error) {
      throw error;
    }
  };

  updateMakerCheckerConfig = async (req, res) => {
    try {
      // Fetch original data before update
      const originalConfig = await VerificationConfig.findOne({ companyId: req.admin.companyId });

      const makerCheckerConfig = req.body;
      const config = await VerificationConfig.findOneAndUpdate(
        { companyId: req.admin.companyId },
        { makerCheckerConfig, updatedBy: req.admin._id },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );

      const isNewConfig = !originalConfig;

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.sales,
        subModuleAffected: null,
        fileAffected: FILE.file_salesVerification,
        modelAffected: [MODEL_AFFECTED.model_VerificationConfig],
        eventType: isNewConfig ? SALES_MAKER_CHECKER_CONFIG_CREATED : SALES_MAKER_CHECKER_CONFIG_UPDATED,
        actionDone: isNewConfig ? ACTIONS.create : ACTIONS.update,
        oldData: isNewConfig ? null : originalConfig.toObject(),
        newData: config.toObject(),
        description: `Sales maker-checker configuration ${isNewConfig ? 'created' : 'updated'} by ${getFullName(req.admin.employeeInfo)}`
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

  // Workflow settings
  getWorkflowSettings = async (req, res) => {
    try {
      const config = await VerificationConfig.findOne({
        companyId: req.admin.companyId,
        status: 'active',
      });
      if (!config) {
        return res.json({
          success: true,
          data: this.getDefaultConfig(req.admin.companyId, req.admin._id).workflowSettings,
        });
      }
      res.json({ success: true, data: config.workflowSettings });
    } catch (error) {
      throw error;
    }
  };

  updateWorkflowSettings = async (req, res) => {
    try {
      // Fetch original data before update
      const originalConfig = await VerificationConfig.findOne({ companyId: req.admin.companyId });

      const workflowSettings = req.body;
      const config = await VerificationConfig.findOneAndUpdate(
        { companyId: req.admin.companyId },
        { workflowSettings, updatedBy: req.admin._id },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );

      const isNewConfig = !originalConfig;

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.sales,
        subModuleAffected: null,
        fileAffected: FILE.file_salesVerification,
        modelAffected: [MODEL_AFFECTED.model_VerificationConfig],
        eventType: isNewConfig ? SALES_VERIFICATION_CONFIG_CREATED : SALES_VERIFICATION_CONFIG_UPDATED,
        actionDone: isNewConfig ? ACTIONS.create : ACTIONS.update,
        oldData: isNewConfig ? null : originalConfig.toObject(),
        newData: config.toObject(),
        description: `Sales workflow settings ${isNewConfig ? 'created' : 'updated'} by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        data: config.workflowSettings,
        message: 'Workflow settings updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  // Notification settings
  getNotificationSettings = async (req, res) => {
    try {
      const config = await VerificationConfig.findOne({
        companyId: req.admin.companyId,
        status: 'active',
      });
      if (!config) {
        return res.json({
          success: true,
          data: this.getDefaultConfig(req.admin.companyId, req.admin._id).notificationSettings,
        });
      }
      res.json({ success: true, data: config.notificationSettings });
    } catch (error) {
      throw error;
    }
  };

  updateNotificationSettings = async (req, res) => {
    try {
      // Fetch original data before update
      const originalConfig = await VerificationConfig.findOne({ companyId: req.admin.companyId });

      const notificationSettings = req.body;
      const config = await VerificationConfig.findOneAndUpdate(
        { companyId: req.admin.companyId },
        { notificationSettings, updatedBy: req.admin._id },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );

      const isNewConfig = !originalConfig;

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.sales,
        subModuleAffected: null,
        fileAffected: FILE.file_salesVerification,
        modelAffected: [MODEL_AFFECTED.model_VerificationConfig],
        eventType: isNewConfig ? SALES_NOTIFICATION_SETTINGS_CREATED : SALES_NOTIFICATION_SETTINGS_UPDATED,
        actionDone: isNewConfig ? ACTIONS.create : ACTIONS.update,
        oldData: isNewConfig ? null : originalConfig.toObject(),
        newData: config.toObject(),
        description: `Sales notification settings ${isNewConfig ? 'created' : 'updated'} by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        data: config.notificationSettings,
        message: 'Notification settings updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  // Available checkers (same as MM)
  getAvailableCheckers = async (req, res) => {
    try {
      const User = require('../../models/userModels/User');
      // Exclude the current user (maker) from the checker list
      const checkers = await User.find({
        companyId: req.admin.companyId,
        status: 'active',
        _id: { $ne: req.admin._id },
      })
        .select('_id name email role department')
        .sort({ name: 1 });
      res.json({ success: true, data: checkers });
    } catch (error) {
      throw error;
    }
  };

  getDefaultConfig(companyId, userId) {
    return {
      companyId,
      verificationRequirements: {
        pan: { required: true, autoVerify: true, allowManualOverride: true },
        tan: { required: false, autoVerify: true, allowManualOverride: true },
        gstin: { required: true, autoVerify: true, allowManualOverride: true },
        msme: { required: false, autoVerify: true, allowManualOverride: true },
        bankAccount: { required: true, autoVerify: true, allowManualOverride: true },
      },
      makerCheckerConfig: {
        enabled: true,
        allowMakerToSelectChecker: true,
        defaultCheckerRole: 'manager',
        requireCheckerApproval: true,
        autoApproveAfterDays: 7,
      },
      status: 'active',
      createdBy: userId,
    };
  }
}

module.exports = new SalesVerificationConfigController();
