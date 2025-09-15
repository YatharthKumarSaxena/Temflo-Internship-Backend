const Supplier = require('../../models/MaterialModels/SupplierModel');
const VerificationConfig = require('../../models/MaterialModels/VerificationConfigModel');
const governmentVerificationService = require('../../services/governmentVerificationService');
const { catchErrors } = require('@/handlers/errorHandlers');

class SupplierVerificationController {
  /**
   * Verify a single field (for real-time verification in forms)
   */
  async verifyField(req, res) {
    try {
      const { fieldType, fieldValue } = req.body;

      if (!fieldType || !fieldValue) {
        return res.status(400).json({
          success: false,
          message: 'Field type and value are required',
        });
      }

      // Get verification configuration
      const config = await VerificationConfig.findOne({
        companyId: req.admin.companyId,
        status: 'active',
      });

      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Verification configuration not found',
        });
      }

      let result = null;
      let errorMessage = null;

      try {
        switch (fieldType) {
          case 'pan':
            result = await governmentVerificationService.verifyPAN(fieldValue);
            break;
          case 'tan':
            result = await governmentVerificationService.verifyTAN(fieldValue);
            break;
          case 'gstin':
            result = await governmentVerificationService.verifyGSTIN(fieldValue);
            break;
          case 'msme':
            result = await governmentVerificationService.verifyMSME(fieldValue);
            break;
          case 'bankAccount':
            result = await governmentVerificationService.verifyBankAccount(fieldValue);
            break;
          default:
            return res.status(400).json({
              success: false,
              message: 'Invalid field type',
            });
        }

        res.json({
          success: true,
          data: {
            status: result.success ? 'verified' : 'failed',
            verificationData: result.data,
            errorMessage: result.error || null,
          },
        });
      } catch (error) {
        console.error(`Error verifying ${fieldType}:`, error);
        res.json({
          success: true,
          data: {
            status: 'failed',
            verificationData: null,
            errorMessage: error.message || 'Verification failed',
          },
        });
      }
    } catch (error) {
      console.error('Error in verifyField:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Verify a specific supplier's details
   */
  async verifySupplier(req, res) {
    try {
      const { id } = req.params;
      const { verificationTypes } = req.body; // Array of types to verify: ['pan', 'tan', 'gstin', 'msme', 'bank']

      const supplier = await Supplier.findById(id).populate(
        'makerChecker.maker makerChecker.checker',
        'name email'
      );

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      // Get verification configuration
      const config = await VerificationConfig.findOne({
        companyId: req.admin.companyId,
        status: 'active',
      });

      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Verification configuration not found',
        });
      }

      const verificationResults = {};
      const errors = [];

      // Verify each requested type
      for (const type of verificationTypes) {
        try {
          let result = null;

          switch (type) {
            case 'pan':
              if (supplier.pan) {
                result = await this.verifyPAN(supplier.pan, config);
                supplier.verificationDetails.pan = {
                  ...supplier.verificationDetails.pan,
                  status: result.isValid ? 'verified' : 'failed',
                  verifiedAt: new Date(),
                  verifiedBy: req.user.id,
                  verificationData: result,
                  errorMessage: result.error || null,
                  isManualOverride: false,
                };
              }
              break;

            case 'tan':
              if (supplier.tan) {
                result = await this.verifyTAN(supplier.tan, config);
                supplier.verificationDetails.tan = {
                  ...supplier.verificationDetails.tan,
                  status: result.isValid ? 'verified' : 'failed',
                  verifiedAt: new Date(),
                  verifiedBy: req.user.id,
                  verificationData: result,
                  errorMessage: result.error || null,
                  isManualOverride: false,
                };
              }
              break;

            case 'gstin':
              if (supplier.gstin) {
                result = await this.verifyGSTIN(supplier.gstin, config);
                supplier.verificationDetails.gstin = {
                  ...supplier.verificationDetails.gstin,
                  status: result.isValid ? 'verified' : 'failed',
                  verifiedAt: new Date(),
                  verifiedBy: req.user.id,
                  verificationData: result,
                  errorMessage: result.error || null,
                  isManualOverride: false,
                };
              }
              break;

            case 'msme':
              if (supplier.msmeRegistered && supplier.msmeRegistrationNumber) {
                result = await this.verifyMSME(supplier.msmeRegistrationNumber, config);
                supplier.verificationDetails.msme = {
                  ...supplier.verificationDetails.msme,
                  status: result.isValid ? 'verified' : 'failed',
                  verifiedAt: new Date(),
                  verifiedBy: req.user.id,
                  verificationData: result,
                  errorMessage: result.error || null,
                  isManualOverride: false,
                };
              }
              break;

            case 'bank':
              if (supplier.bankAccounts && supplier.bankAccounts.length > 0) {
                for (let i = 0; i < supplier.bankAccounts.length; i++) {
                  const bankAccount = supplier.bankAccounts[i];
                  result = await this.verifyBankAccount(bankAccount, config);

                  // Update or create bank account verification
                  let bankVerification = supplier.verificationDetails.bankAccounts.find(
                    (ba) => ba.accountNumber === bankAccount.accountNumber
                  );

                  if (!bankVerification) {
                    bankVerification = {
                      accountNumber: bankAccount.accountNumber,
                      ifscCode: bankAccount.ifscCode,
                      status: 'pending',
                    };
                    supplier.verificationDetails.bankAccounts.push(bankVerification);
                  }

                  bankVerification.status = result.isValid ? 'verified' : 'failed';
                  bankVerification.verifiedAt = new Date();
                  bankVerification.verifiedBy = req.user.id;
                  bankVerification.verificationData = result;
                  bankVerification.errorMessage = result.error || null;
                  bankVerification.isManualOverride = false;
                }
              }
              break;
          }

          verificationResults[type] = result;
        } catch (error) {
          console.error(`Error verifying ${type}:`, error);
          errors.push({ type, error: error.message });
        }
      }

      // Update overall verification status
      const overallStatus = this.calculateOverallVerificationStatus(supplier.verificationDetails);

      // Use findByIdAndUpdate to ensure required fields are preserved
      const updatedSupplier = await Supplier.findByIdAndUpdate(
        id,
        {
          $set: {
            verificationDetails: supplier.verificationDetails,
            verificationStatus: overallStatus,
            updatedBy: req.user.id,
          },
        },
        { new: true, runValidators: true }
      ).populate('makerChecker.maker makerChecker.checker', 'name email');

      res.json({
        success: true,
        data: {
          supplier: updatedSupplier,
          verificationResults,
          errors: errors.length > 0 ? errors : null,
        },
        message: 'Supplier verification completed',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify all supplier details in batch
   */
  async verifyAllSupplierDetails(req, res) {
    try {
      const { id } = req.params;

      const supplier = await Supplier.findById(id);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      // Get verification configuration
      const config = await VerificationConfig.findOne({
        companyId: req.admin.companyId,
        status: 'active',
      });

      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Verification configuration not found',
        });
      }

      // Perform comprehensive verification
      const verificationResults = await governmentVerificationService.verifySupplierDetails(
        supplier.toObject()
      );

      // Update supplier verification details
      supplier.verificationDetails = this.mapVerificationResults(verificationResults, req.user.id);
      supplier.verificationStatus = verificationResults.overallStatus;
      supplier.updatedBy = req.user.id;

      await supplier.save();

      res.json({
        success: true,
        data: {
          supplier: supplier,
          verificationResults,
        },
        message: 'Complete supplier verification completed',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Manual override for verification
   */
  async manualVerificationOverride(req, res) {
    try {
      const { id } = req.params;
      const { verificationType, status, comments } = req.body;

      const supplier = await Supplier.findById(id);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      // Get verification configuration
      const config = await VerificationConfig.findOne({
        companyId: req.admin.companyId,
        status: 'active',
      });

      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Verification configuration not found',
        });
      }

      // Check if manual override is allowed
      const requirement = config.verificationRequirements[verificationType];
      if (!requirement || !requirement.allowManualOverride) {
        return res.status(400).json({
          success: false,
          message: `Manual override not allowed for ${verificationType}`,
        });
      }

      // Update verification details
      if (supplier.verificationDetails[verificationType]) {
        supplier.verificationDetails[verificationType].status = status;
        supplier.verificationDetails[verificationType].verifiedAt = new Date();
        supplier.verificationDetails[verificationType].verifiedBy = req.user.id;
        supplier.verificationDetails[verificationType].isManualOverride = true;
        supplier.verificationDetails[verificationType].manualOverrideComments = comments;
      }

      // Update overall verification status
      supplier.verificationStatus = this.calculateOverallVerificationStatus(
        supplier.verificationDetails
      );
      supplier.updatedBy = req.user.id;

      await supplier.save();

      res.json({
        success: true,
        data: supplier,
        message: 'Manual verification override applied successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign checker to supplier
   */
  async assignChecker(req, res) {
    try {
      const { id } = req.params;
      const { checkerId } = req.body;

      const supplier = await Supplier.findById(id);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      // Get verification configuration
      const config = await VerificationConfig.findOne({
        companyId: req.admin.companyId,
        status: 'active',
      });

      if (!config || !config.makerCheckerConfig.enabled) {
        return res.status(400).json({
          success: false,
          message: 'Maker-checker configuration not enabled',
        });
      }

      // Check if maker can select checker
      if (
        !config.makerCheckerConfig.allowMakerToSelectChecker &&
        supplier.makerChecker.maker.toString() !== req.user.id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to assign a checker for this supplier',
        });
      }

      // Prevent maker from being assigned as checker
      if (
        checkerId &&
        supplier.makerChecker?.maker &&
        supplier.makerChecker.maker.toString() === checkerId.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Maker cannot be a checker',
        });
      }

      // Update checker assignment
      supplier.makerChecker.checker = checkerId;
      supplier.makerChecker.checkerAssignedBy = req.user.id;
      supplier.makerChecker.checkerAssignedAt = new Date();
      supplier.updatedBy = req.user.id;

      await supplier.save();

      res.json({
        success: true,
        data: supplier,
        message: 'Checker assigned successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Checker approval/rejection
   */
  async checkerAction(req, res) {
    try {
      const { id } = req.params;
      const { action, comments } = req.body; // action: 'approved' or 'rejected'

      const supplier = await Supplier.findById(id);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      // Ensure maker and checker are not same in stored record
      if (
        supplier.makerChecker?.maker &&
        supplier.makerChecker?.checker &&
        supplier.makerChecker.maker.toString() === supplier.makerChecker.checker.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid state: maker and checker cannot be the same user',
        });
      }

      // Check if user is the assigned checker
      if (supplier.makerChecker.checker.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to perform this action',
        });
      }

      // Update checker action
      supplier.makerChecker.checkerAction = action;
      supplier.makerChecker.checkerActionAt = new Date();
      supplier.makerChecker.checkerComments = comments;
      supplier.updatedBy = req.user.id;

      // Update approval status based on checker action
      if (action === 'approved') {
        supplier.approvalStatus = 'approved';
      } else if (action === 'rejected') {
        supplier.approvalStatus = 'rejected';
      }

      await supplier.save();

      res.json({
        success: true,
        data: supplier,
        message: `Supplier ${action} successfully`,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get verification status for a supplier
   */
  async getVerificationStatus(req, res) {
    try {
      const { id } = req.params;

      const supplier = await Supplier.findById(id)
        .populate(
          'verificationDetails.pan.verifiedBy verificationDetails.tan.verifiedBy verificationDetails.gstin.verifiedBy verificationDetails.msme.verifiedBy',
          'name email'
        )
        .populate(
          'makerChecker.maker makerChecker.checker makerChecker.checkerAssignedBy',
          'name email'
        );

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      res.json({
        success: true,
        data: {
          verificationStatus: supplier.verificationStatus,
          verificationDetails: supplier.verificationDetails,
          makerChecker: supplier.makerChecker,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Helper methods
  async verifyPAN(pan, config) {
    if (config.apiConfig.useMockApis) {
      return await governmentVerificationService.mockVerification('pan', pan);
    }
    return await governmentVerificationService.verifyPAN(pan);
  }

  async verifyTAN(tan, config) {
    if (config.apiConfig.useMockApis) {
      return await governmentVerificationService.mockVerification('tan', tan);
    }
    return await governmentVerificationService.verifyTAN(tan);
  }

  async verifyGSTIN(gstin, config) {
    if (config.apiConfig.useMockApis) {
      return await governmentVerificationService.mockVerification('gstin', gstin);
    }
    return await governmentVerificationService.verifyGSTIN(gstin);
  }

  async verifyMSME(msmeNumber, config) {
    if (config.apiConfig.useMockApis) {
      return await governmentVerificationService.mockVerification('msme', msmeNumber);
    }
    return await governmentVerificationService.verifyMSME(msmeNumber);
  }

  async verifyBankAccount(bankAccount, config) {
    if (config.apiConfig.useMockApis) {
      return await governmentVerificationService.mockVerification('bank', bankAccount);
    }
    return await governmentVerificationService.verifyBankAccount(bankAccount);
  }

  calculateOverallVerificationStatus(verificationDetails) {
    const statuses = [
      verificationDetails.pan?.status,
      verificationDetails.tan?.status,
      verificationDetails.gstin?.status,
      verificationDetails.msme?.status,
      ...verificationDetails.bankAccounts.map((ba) => ba.status),
    ].filter((status) => status && status !== 'not_required');

    if (statuses.length === 0) return 'not_required';
    if (statuses.every((status) => status === 'verified')) return 'verified';
    if (statuses.some((status) => status === 'verified')) return 'partially_verified';
    if (statuses.every((status) => status === 'failed')) return 'failed';
    return 'pending';
  }

  mapVerificationResults(verificationResults, userId) {
    return {
      pan: {
        status: verificationResults.pan?.isValid ? 'verified' : 'failed',
        verifiedAt: verificationResults.pan?.verifiedAt,
        verifiedBy: userId,
        verificationData: verificationResults.pan,
        errorMessage: verificationResults.pan?.error || null,
        isManualOverride: false,
      },
      tan: {
        status: verificationResults.tan?.isValid ? 'verified' : 'failed',
        verifiedAt: verificationResults.tan?.verifiedAt,
        verifiedBy: userId,
        verificationData: verificationResults.tan,
        errorMessage: verificationResults.tan?.error || null,
        isManualOverride: false,
      },
      gstin: {
        status: verificationResults.gstin?.isValid ? 'verified' : 'failed',
        verifiedAt: verificationResults.gstin?.verifiedAt,
        verifiedBy: userId,
        verificationData: verificationResults.gstin,
        errorMessage: verificationResults.gstin?.error || null,
        isManualOverride: false,
      },
      msme: {
        status: verificationResults.msme?.isValid ? 'verified' : 'failed',
        verifiedAt: verificationResults.msme?.verifiedAt,
        verifiedBy: userId,
        verificationData: verificationResults.msme,
        errorMessage: verificationResults.msme?.error || null,
        isManualOverride: false,
      },
      bankAccounts: verificationResults.bankAccounts.map((ba) => ({
        accountNumber: ba.accountNumber,
        ifscCode: ba.ifscCode,
        status: ba.verification.isValid ? 'verified' : 'failed',
        verifiedAt: ba.verification.verifiedAt,
        verifiedBy: userId,
        verificationData: ba.verification,
        errorMessage: ba.verification.error || null,
        isManualOverride: false,
      })),
    };
  }
}

module.exports = new SupplierVerificationController();
