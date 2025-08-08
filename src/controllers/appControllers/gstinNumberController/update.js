// const User = require("../../../models/userModels/User"); // Adjust path as needed

// const stateMap = {
//   "01": "Jammu & Kashmir",
//   "02": "Himachal Pradesh",
//   "03": "Punjab",
//   "04": "Chandigarh",
//   "05": "Uttarakhand",
//   "06": "Haryana",
//   "07": "Delhi",
//   "08": "Rajasthan",
//   "09": "Uttar Pradesh",
//   "10": "Bihar",
//   "11": "Sikkim",
//   "12": "Arunachal Pradesh",
//   "13": "Nagaland",
//   "14": "Manipur",
//   "15": "Mizoram",
//   "16": "Tripura",
//   "17": "Meghalaya",
//   "18": "Assam",
//   "19": "West Bengal",
//   "20": "Jharkhand",
//   "21": "Odisha",
//   "22": "Chhattisgarh",
//   "23": "Madhya Pradesh",
//   "24": "Gujarat",
//   "25": "Daman & Diu",
//   "26": "Dadra & Nagar Haveli",
//   "27": "Maharashtra",
//   "28": "Andhra Pradesh (Old)",
//   "29": "Karnataka",
//   "30": "Goa",
//   "31": "Lakshadweep",
//   "32": "Kerala",
//   "33": "Tamil Nadu",
//   "34": "Puducherry",
//   "35": "Andaman & Nicobar Islands",
//   "36": "Telangana",
//   "37": "Andhra Pradesh"
// };

// const update = async (Model, req, res) => {
//   try {
//     const companyId = req.admin.companyId;
//     const adminId = req.admin.id;

//     const { stateCode, stateName, gstinNumber } = req.body;

//     if(!stateCode || !stateName || !gstinNumber){
//       return res.status(404).json({
//         success: false,
//         message: "All fields Required",
//       });
//     }

//     // Fetch PAN from User model
//     const user = await User.findById(adminId).lean();
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Admin user not found.",
//       });
//     }

//     const panNumber = user.pan;
//     if (!panNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "Company PAN number not found. Please save PAN first.",
//       });
//     }

//     // Validate state code and name
//     if (!stateMap[stateCode] || stateMap[stateCode] !== stateName) {
//       return res.status(400).json({
//         success: false,
//         message: "State code and state name do not match.",
//       });
//     }

//     // Validate GSTIN format
//     if (!gstinNumber || gstinNumber.length !== 15) {
//       return res.status(400).json({
//         success: false,
//         message: "GSTIN number must be exactly 15 characters.",
//       });
//     }

//     const gstinPanPart = gstinNumber.substring(2, 12).toUpperCase();
//     if (gstinPanPart !== panNumber.toUpperCase()) {
//       return res.status(400).json({
//         success: false,
//         message: "GSTIN PAN part does not match company PAN.",
//       });
//     }

//     const gstinStateCode = gstinNumber.substring(0, 2);
//     if (gstinStateCode !== stateCode) {
//       return res.status(400).json({
//         success: false,
//         message: "GSTIN state code does not match selected state code.",
//       });
//     }

//     // Perform update
//     const updatedGSTIN = await Model.findOneAndUpdate(
//       { _id: req.params.id, companyId },
//       { stateCode, stateName, gstinNumber },
//       { new: true }
//     );

//     if (!updatedGSTIN) {
//       return res.status(404).json({
//         success: false,
//         message: "GSTIN Number not found or you do not have access to this GSTIN Number.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       result: updatedGSTIN,
//       message: "GSTIN Number updated successfully",
//     });

//   } catch (error) {
//     console.error("Update GSTIN Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// module.exports = update;


const update= async (Model, req, res) => {
  try {
    return res.status(404).json({
      success: false,
      message: 'You Can Not Update the GSTIN Number',
    });

   
  } catch (error) {
    console.error('Update Admin Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }

  
};

module.exports = update;
