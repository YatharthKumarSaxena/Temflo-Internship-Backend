const User = require('../../../models/userModels/User')
const stateMap = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (Old)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh"
};

const create = async (Model, req, res) => {
  try {
    const { stateCode, stateName, gstinNumber } = req.body;

    // Fetch user data to get PAN and companyId
    const user = await User.findById(req.admin.id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found.",
      });
    }

    const panNumber = user.pan;
    const companyId = req.admin.companyId;

    if (!stateMap[stateCode] || stateMap[stateCode] !== stateName) {
      return res.status(400).json({
        success: false,
        message: "State code and state name do not match.",
      });
    }

    if (!gstinNumber || gstinNumber.length !== 15) {
      return res.status(400).json({
        success: false,
        message: "GSTIN number must be exactly 15 characters.",
      });
    }

    if (!panNumber) {
      return res.status(400).json({
        success: false,
        message: "Company PAN number not found. Please save PAN first.",
      });
    }

    const gstinPanPart = gstinNumber.substring(2, 12).toUpperCase();
    if (gstinPanPart !== panNumber.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: "GSTIN number PAN part does not match company PAN.",
      });
    }

    const gstinStateCode = gstinNumber.substring(0, 2);
    if (gstinStateCode !== stateCode) {
      return res.status(400).json({
        success: false,
        message: "GSTIN number state code does not match selected state code.",
      });
    }

    req.body.removed = false;

    const result = await new Model({
      ...req.body,
      companyId,
    }).save();

    return res.status(200).json({
      success: true,
      result,
      message: "Successfully Added GSTIN Number",
    });
  } catch (error) {
    console.error("Error adding GSTIN:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = create;