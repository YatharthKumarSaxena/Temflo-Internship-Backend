const User = require('../../../models/userModels/User');

const updateCompanyDetails = async (req, res) => {
  try {
    const id = req.admin._id; // Admin ID passed in URL

    // Fetch current admin to evaluate conditional validations against existing values
    const currentAdmin = await User.findById(id);
    if (!currentAdmin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const {
      legalStatus,
      tan,
      pan,
      year,
      financialYear,
      name,
      address,
      city,
      state,
      country,
      pinCode,
      phoneNumber,
      currency,
      cin,
      msmeRegistered,
      msmeNumber,
    } = req.body;

    const effectiveLegalStatus =
      typeof legalStatus !== 'undefined' ? legalStatus : currentAdmin.legalStatus;
    const effectiveMsmeRegistered =
      typeof msmeRegistered !== 'undefined' ? msmeRegistered : currentAdmin.msmeRegistered;

    // Server-side validations
    // Year handling: allow 'Financial'/'Calendar' (case-insensitive) OR numeric/range to be stored in financialYear
    let normalizedYear = undefined;
    let normalizedFinancialYear =
      typeof financialYear !== 'undefined' && financialYear !== null && financialYear !== ''
        ? String(financialYear).trim()
        : undefined;

    if (typeof year !== 'undefined' && year !== null && year !== '') {
      const rawYear = String(year).trim();
      const allowedYears = ['financial', 'calendar'];
      const fyRegex = /^\d{4}(-\d{4})?$/;
      if (allowedYears.includes(rawYear.toLowerCase())) {
        normalizedYear = rawYear[0].toUpperCase() + rawYear.slice(1).toLowerCase();
      } else if (fyRegex.test(rawYear)) {
        normalizedFinancialYear = rawYear;
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Invalid 'year'. Use 'Financial'/'Calendar' or provide 'financialYear' as 'YYYY' or 'YYYY-YYYY'",
        });
      }
    }

    // financialYear validation: allow YYYY or YYYY-YYYY
    if (typeof normalizedFinancialYear !== 'undefined') {
      const fy = String(normalizedFinancialYear).trim();
      const fyRegex = /^\d{4}(-\d{4})?$/;
      if (!fyRegex.test(fy)) {
        return res.status(400).json({
          success: false,
          message: "Invalid 'financialYear'. Use 'YYYY' or 'YYYY-YYYY' (e.g., 2025-2026)",
        });
      }
    }

    // PAN normalization and validation (uppercase, format ABCDE1234F)
    let normalizedPan = undefined;
    if (typeof pan !== 'undefined') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      normalizedPan = String(pan).toUpperCase();
      if (!panRegex.test(normalizedPan)) {
        return res.status(400).json({
          success: false,
          message: "Invalid PAN format. Expected 'ABCDE1234F' (5 letters, 4 digits, 1 letter)",
        });
      }
    }
    if (effectiveLegalStatus === 'C') {
      if (!cin) {
        return res.status(400).json({ success: false, message: 'CIN is required for companies' });
      }
      const cinRegex = /^[A-Za-z0-9]{21}$/;
      if (!cinRegex.test(cin)) {
        return res
          .status(400)
          .json({ success: false, message: 'CIN must be a 21-character alphanumeric code' });
      }
    }

    if (effectiveMsmeRegistered === true) {
      if (!msmeNumber) {
        return res
          .status(400)
          .json({ success: false, message: 'MSME Number is required when MSME Registered is Yes' });
      }
      // UDYAM + 4 letters + 7 digits
      const msmeRegex = /^UDYAM[A-Z]{4}\d{7}$/;
      if (!msmeRegex.test(String(msmeNumber).toUpperCase())) {
        return res.status(400).json({
          success: false,
          message:
            "Enter a valid UDYAM Registration Number (format: 'UDYAM' + 4 letters + 7 digits)",
        });
      }
    }

    // Build update payload only with defined fields to avoid unintended overwrites
    const updatePayload = {};
    if (typeof legalStatus !== 'undefined') updatePayload.legalStatus = legalStatus;
    if (typeof tan !== 'undefined') updatePayload.tan = tan;
    if (typeof normalizedPan !== 'undefined') updatePayload.pan = normalizedPan;
    if (typeof normalizedYear !== 'undefined') updatePayload.year = normalizedYear;
    if (typeof normalizedFinancialYear !== 'undefined')
      updatePayload.financialYear = normalizedFinancialYear;
    if (typeof name !== 'undefined') updatePayload.name = name;
    if (typeof address !== 'undefined') updatePayload.address = address;
    if (typeof city !== 'undefined') updatePayload.city = city;
    if (typeof state !== 'undefined') updatePayload.state = state;
    if (typeof country !== 'undefined') updatePayload.country = country;
    if (typeof pinCode !== 'undefined') updatePayload.pinCode = pinCode;
    if (typeof phoneNumber !== 'undefined') updatePayload.phoneNumber = phoneNumber;
    if (typeof currency !== 'undefined') updatePayload.currency = currency;
    if (typeof cin !== 'undefined') updatePayload.cin = cin;
    if (typeof msmeRegistered !== 'undefined') updatePayload.msmeRegistered = msmeRegistered;
    if (effectiveMsmeRegistered && typeof msmeNumber !== 'undefined')
      updatePayload.msmeNumber = msmeNumber;

    const updatedAdmin = await User.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
      context: 'query',
    });

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    return res.status(200).json({
      success: true,
      result: updatedAdmin,
      message: 'Company details updated successfully',
    });
  } catch (error) {
    console.error('Update Admin Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = updateCompanyDetails;
