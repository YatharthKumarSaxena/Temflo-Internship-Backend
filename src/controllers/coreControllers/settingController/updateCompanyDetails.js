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
      const msmeRegex = /^\d{19}$/;
      if (!msmeRegex.test(msmeNumber)) {
        return res
          .status(400)
          .json({ success: false, message: 'Enter a valid 19-digit Udyam Registration Number' });
      }
    }

    const updatePayload = {
      legalStatus,
      tan,
      pan,
      year,
      name,
      address,
      city,
      state,
      country,
      pinCode,
      phoneNumber,
      currency,
      cin: typeof cin !== 'undefined' ? cin : currentAdmin.cin,
      msmeRegistered:
        typeof msmeRegistered !== 'undefined' ? msmeRegistered : currentAdmin.msmeRegistered,
      msmeNumber: effectiveMsmeRegistered ? msmeNumber : undefined,
    };

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
