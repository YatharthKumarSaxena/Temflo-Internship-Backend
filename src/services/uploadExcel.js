// middlewares/uploadExcel.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/excelsheets exists
const uploadDir = path.join(__dirname, '../uploads/excelsheets');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only Excel files are allowed'), false);
};

const uploadExcel = multer({ storage, fileFilter });

module.exports = uploadExcel;
