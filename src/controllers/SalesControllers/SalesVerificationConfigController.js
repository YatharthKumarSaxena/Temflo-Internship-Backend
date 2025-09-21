const VerificationConfig = require('../../models/MaterialModels/VerificationConfigModel');
const { catchErrors } = require('@/handlers/errorHandlers');

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
          data: this.getDefaultConfig(req.admin.companyId, req.user.id),
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
          data: this.getDefaultConfig(req.admin.companyId, req.user.id).makerCheckerConfig,
        });
      }
      res.json({ success: true, data: config.makerCheckerConfig });
    } catch (error) {
      throw error;
    }
  };

  updateMakerCheckerConfig = async (req, res) => {
    try {
      const makerCheckerConfig = req.body;
      const config = await VerificationConfig.findOneAndUpdate(
        { companyId: req.admin.companyId },
        { makerCheckerConfig, updatedBy: req.user.id },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
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
          data: this.getDefaultConfig(req.admin.companyId, req.user.id).workflowSettings,
        });
      }
      res.json({ success: true, data: config.workflowSettings });
    } catch (error) {
      throw error;
    }
  };

  updateWorkflowSettings = async (req, res) => {
    try {
      const workflowSettings = req.body;
      const config = await VerificationConfig.findOneAndUpdate(
        { companyId: req.admin.companyId },
        { workflowSettings, updatedBy: req.user.id },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
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
          data: this.getDefaultConfig(req.admin.companyId, req.user.id).notificationSettings,
        });
      }
      res.json({ success: true, data: config.notificationSettings });
    } catch (error) {
      throw error;
    }
  };

  updateNotificationSettings = async (req, res) => {
    try {
      const notificationSettings = req.body;
      const config = await VerificationConfig.findOneAndUpdate(
        { companyId: req.admin.companyId },
        { notificationSettings, updatedBy: req.user.id },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
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
        _id: { $ne: req.user.id },
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
