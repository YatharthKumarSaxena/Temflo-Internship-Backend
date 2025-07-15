const User = require('../../../models/userModels/User'); // Adjust path to your User model
const XLSX = require('xlsx');


function flattenUser(user) {
  const employeeInfo = user.employeeInfo || {};
  const address = user.address || {};
  const cAddr = user.cAddress || '';

  // Convert experience array to a string
  const experienceStr = (user.experience || []).map((exp, index) =>
    `#${index + 1}: ${exp.company || ''}, ${exp.position || ''}, ${exp.dateOfEntry || ''} to ${exp.dateOfExit || ''}`
  ).join('\n');

  const degreeStr = (user.degreeInfo || []).map((deg, index) =>
    `#${index + 1}: ${deg.degree || ''}, ${deg.institute || ''}, ${deg.year || ''}, ${deg.percentage || ''}`
  ).join('\n');

  const permanentAddress = address.permanentAddress || {};
  const presentAddress = address.presentAddress || {};

  return {
    Name: user.name || '',
    Email: user.email || '',
    Mobile: user.mobile || '',
    Role: user.role || '',
    Status: user.status || '',
    EmployeeCode: user.employeeCode || '',
    PlantName: user.plantId?.name || '',
    City: user.city || '',
    State: user.state || '',
    Country: user.country || '',
    PinCode: user.pinCode || '',
    PhoneNumber: user.phoneNumber || '',
    Address_Current: cAddr || '',
    FirstName: employeeInfo.firstName || '',
    LastName: employeeInfo.lastName || '',
    BloodGroup: employeeInfo.bloodGroup || '',
    Gender: employeeInfo.gender || '',
    DOB: employeeInfo.dob ? new Date(employeeInfo.dob).toLocaleDateString() : '',
    PersonalEmail: employeeInfo.emailPersonal || '',
    Department: employeeInfo.department || '',
    DateOfJoining: employeeInfo.dateOfJoining ? new Date(employeeInfo.dateOfJoining).toLocaleDateString() : '',
    Designation: employeeInfo.designation || '',
    PermanentAddress: `${permanentAddress.address || ''}, ${permanentAddress.city || ''}, ${permanentAddress.state || ''}, ${permanentAddress.country || ''}`,
    PresentAddress: `${presentAddress.address || ''}, ${presentAddress.city || ''}, ${presentAddress.state || ''}, ${presentAddress.country || ''}`,
    Experience: experienceStr,
    Degrees: degreeStr,
    BankAccount: user.bankDetail?.accountNumber || '',
    BankName: user.bankDetail?.bankName || '',
    IFSC: user.bankDetail?.ifscCode || '',
    AccountType: user.bankDetail?.accountType || '',
    AccountHolder: user.bankDetail?.accountHolder || '',
    PAN: user.pan || '',
    AadharCard: user.panaddhar?.aadharCard || '',
    LegalStatus: user.legalStatus || '',
    TAN: user.tan || '',
    YearType: user.year || '',
    Created: new Date(user.created).toLocaleString(),
  };
}

const downloadFile = async (req, res, next) => {

  try {
    const users = await User.find({companyId:req.admin.companyId,removed:false})
      .populate('plantId', 'name')

    const excelData = users.map(user => flattenUser(user));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=All_Users.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.status(200).send(buffer);
  } catch (err) {
    console.error('Error generating Excel file:', err);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
  
};

module.exports = downloadFile;
