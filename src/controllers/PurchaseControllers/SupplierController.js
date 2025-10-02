const Supplier = require('../../models/PurchaseModels/Supplier');
const { validatePANandGSTIN } = require('../../utils/validation');

exports.createSupplier = async (req, res) => {
  try {
    const {
      plantId,
      supplierName,
      legalStatus,
      address,
      city,
      state,
      country,
      pinCode,
      mailId,
      phoneNumber,
      gstRegistered,
      gstin,
      msme,
      msmeRegistrationNumber,
      pan,
      tan,
      reconCode,
      bankAccounts,
      taxCode,
      documents,
    } = req.body;

    // 1. Ensure uniqueness of PAN + GSTIN
    const duplicate = await Supplier.findOne({
      companyId: req.admin.companyId,
      plantId,
      pan,
      gstin,
    });
    if (duplicate)
      return res.status(400).json({ message: 'Supplier with same PAN and GSTIN exists.' });

    // 2. PAN-GSTIN-State-Legal validation
    const errors = validatePANandGSTIN(pan, gstin, state, legalStatus);
    if (errors.length) return res.status(400).json({ errors });

    // 3. Auto generate 8-digit supplier code
    const last = await Supplier.findOne().sort({ supplierCode: -1 });
    const supplierCode = last
      ? (parseInt(last.supplierCode) + 1).toString().padStart(8, '0')
      : '00000001';

    const supplier = new Supplier({
      companyId: req.admin.companyId,
      plantId,
      supplierCode,
      supplierName,
      legalStatus,
      address,
      city,
      state,
      country,
      pinCode,
      mailId,
      phoneNumber,
      gstRegistered,
      gstin,
      msme,
      msmeRegistrationNumber,
      pan,
      tan,
      reconCode,
      bankAccounts,
      taxCode,
      documents,
    });

    await supplier.save();
    res.status(201).json({ message: 'Supplier created successfully', supplier });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
