const axios = require('axios');
const DEBUG_VERIFICATION = process.env.DEBUG_VERIFICATION === 'true';

/**
 * Government Verification Service
 * Handles verification of ST, TAN, PAN, MSME, and Bank details through government APIs
 */
class GovernmentVerificationService {
  constructor() {
    this.apiConfig = {
      timeout: 10000, // 10 seconds timeout
      retries: 3,
      retryDelay: 1000, // 1 second
    };
  }

  /**
   * Verify PAN number through Income Tax Department API
   * @param {string} pan - PAN number to verify
   * @returns {Object} Verification result
   */
  async verifyPAN(pan) {
    try {
      // Mock implementation - Replace with actual government API
      // For now, we'll simulate the verification process
      const response = await this.makeApiCall({
        url: 'https://api.income-tax.gov.in/pan/verify',
        method: 'POST',
        data: { pan },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.INCOME_TAX_API_KEY || 'mock-key'}`,
        },
      });

      return {
        isValid: response.data?.status === 'valid',
        data: response.data,
        verifiedAt: new Date(),
        source: 'income_tax_department',
      };
    } catch (error) {
      if (DEBUG_VERIFICATION) console.error('PAN verification error:', error);
      return {
        isValid: false,
        error: error.message,
        verifiedAt: new Date(),
        source: 'income_tax_department',
      };
    }
  }

  /**
   * Verify TAN number through Income Tax Department API
   * @param {string} tan - TAN number to verify
   * @returns {Object} Verification result
   */
  async verifyTAN(tan) {
    try {
      const response = await this.makeApiCall({
        url: 'https://api.income-tax.gov.in/tan/verify',
        method: 'POST',
        data: { tan },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.INCOME_TAX_API_KEY || 'mock-key'}`,
        },
      });

      return {
        isValid: response.data?.status === 'valid',
        data: response.data,
        verifiedAt: new Date(),
        source: 'income_tax_department',
      };
    } catch (error) {
      if (DEBUG_VERIFICATION) console.error('TAN verification error:', error);
      return {
        isValid: false,
        error: error.message,
        verifiedAt: new Date(),
        source: 'income_tax_department',
      };
    }
  }

  /**
   * Verify GSTIN through GST Department API
   * @param {string} gstin - GSTIN to verify
   * @returns {Object} Verification result
   */
  async verifyGSTIN(gstin) {
    try {
      const response = await this.makeApiCall({
        url: 'https://api.gst.gov.in/taxpayerapi/search',
        method: 'POST',
        data: { gstin },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GST_API_KEY || 'mock-key'}`,
        },
      });

      return {
        isValid: response.data?.status === 'active',
        data: response.data,
        verifiedAt: new Date(),
        source: 'gst_department',
      };
    } catch (error) {
      if (DEBUG_VERIFICATION) console.error('GSTIN verification error:', error);
      return {
        isValid: false,
        error: error.message,
        verifiedAt: new Date(),
        source: 'gst_department',
      };
    }
  }

  /**
   * Verify MSME registration through MSME Department API
   * @param {string} msmeNumber - MSME registration number
   * @returns {Object} Verification result
   */
  async verifyMSME(msmeNumber) {
    try {
      const response = await this.makeApiCall({
        url: 'https://api.msme.gov.in/registration/verify',
        method: 'POST',
        data: { registrationNumber: msmeNumber },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MSME_API_KEY || 'mock-key'}`,
        },
      });

      return {
        isValid: response.data?.status === 'active',
        data: response.data,
        verifiedAt: new Date(),
        source: 'msme_department',
      };
    } catch (error) {
      if (DEBUG_VERIFICATION) console.error('MSME verification error:', error);
      return {
        isValid: false,
        error: error.message,
        verifiedAt: new Date(),
        source: 'msme_department',
      };
    }
  }

  /**
   * Verify Bank Account through NPCI/Bank API
   * @param {Object} bankDetails - Bank account details
   * @returns {Object} Verification result
   */
  async verifyBankAccount(bankDetails) {
    try {
      const { accountNumber, ifscCode } = bankDetails;

      const response = await this.makeApiCall({
        url: 'https://api.npci.org.in/bank/verify',
        method: 'POST',
        data: { accountNumber, ifscCode },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NPCI_API_KEY || 'mock-key'}`,
        },
      });

      return {
        isValid: response.data?.status === 'valid',
        data: response.data,
        verifiedAt: new Date(),
        source: 'npci_bank_api',
      };
    } catch (error) {
      if (DEBUG_VERIFICATION) console.error('Bank verification error:', error);
      return {
        isValid: false,
        error: error.message,
        verifiedAt: new Date(),
        source: 'npci_bank_api',
      };
    }
  }

  /**
   * Verify all supplier details in batch
   * @param {Object} supplierData - Complete supplier data
   * @returns {Object} Complete verification results
   */
  async verifySupplierDetails(supplierData) {
    const verificationResults = {
      pan: null,
      tan: null,
      gstin: null,
      msme: null,
      bankAccounts: [],
      overallStatus: 'pending',
      verifiedAt: new Date(),
    };

    try {
      // Verify PAN
      if (supplierData.pan) {
        verificationResults.pan = await this.verifyPAN(supplierData.pan);
      }

      // Verify TAN
      if (supplierData.tan) {
        verificationResults.tan = await this.verifyTAN(supplierData.tan);
      }

      // Verify GSTIN
      if (supplierData.gstin) {
        verificationResults.gstin = await this.verifyGSTIN(supplierData.gstin);
      }

      // Verify MSME
      if (supplierData.msmeRegistered && supplierData.msmeRegistrationNumber) {
        verificationResults.msme = await this.verifyMSME(supplierData.msmeRegistrationNumber);
      }

      // Verify Bank Accounts
      if (supplierData.bankAccounts && supplierData.bankAccounts.length > 0) {
        for (const bankAccount of supplierData.bankAccounts) {
          const bankVerification = await this.verifyBankAccount(bankAccount);
          verificationResults.bankAccounts.push({
            accountNumber: bankAccount.accountNumber,
            ifscCode: bankAccount.ifscCode,
            verification: bankVerification,
          });
        }
      }

      // Determine overall status
      const allVerifications = [
        verificationResults.pan,
        verificationResults.tan,
        verificationResults.gstin,
        verificationResults.msme,
        ...verificationResults.bankAccounts.map((ba) => ba.verification),
      ].filter((v) => v !== null);

      if (allVerifications.length === 0) {
        verificationResults.overallStatus = 'no_data';
      } else if (allVerifications.every((v) => v.isValid)) {
        verificationResults.overallStatus = 'verified';
      } else if (allVerifications.some((v) => v.isValid)) {
        verificationResults.overallStatus = 'partially_verified';
      } else {
        verificationResults.overallStatus = 'failed';
      }

      return verificationResults;
    } catch (error) {
      if (DEBUG_VERIFICATION) console.error('Supplier verification error:', error);
      verificationResults.overallStatus = 'error';
      verificationResults.error = error.message;
      return verificationResults;
    }
  }

  /**
   * Make API call with retry logic
   * @param {Object} config - Axios config
   * @returns {Object} API response
   */
  async makeApiCall(config) {
    let lastError;

    for (let attempt = 1; attempt <= this.apiConfig.retries; attempt++) {
      try {
        const response = await axios({
          ...config,
          timeout: this.apiConfig.timeout,
        });
        return response;
      } catch (error) {
        lastError = error;
        if (DEBUG_VERIFICATION) console.warn(`API call attempt ${attempt} failed:`, error.message);

        if (attempt < this.apiConfig.retries) {
          await this.delay(this.apiConfig.retryDelay * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Delay utility for retry logic
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Mock verification for development/testing
   * @param {string} type - Type of verification
   * @param {string} value - Value to verify
   * @returns {Object} Mock verification result
   */
  async mockVerification(type, value) {
    // Simulate API delay
    await this.delay(1000);

    // Mock validation logic
    let isValid = false;

    switch (type) {
      case 'pan':
        isValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value);
        break;
      case 'tan':
        isValid = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(value);
        break;
      case 'gstin':
        isValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value);
        break;
      case 'msme':
        isValid = value && value.length >= 10;
        break;
      case 'bank':
        isValid = value.accountNumber && value.ifscCode;
        break;
    }

    return {
      isValid,
      data: isValid ? { status: 'valid', verified: true } : { status: 'invalid', verified: false },
      verifiedAt: new Date(),
      source: 'mock_api',
    };
  }
}

module.exports = new GovernmentVerificationService();
