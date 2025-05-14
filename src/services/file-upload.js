const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Dynamically ensure upload path exists
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;


    switch (file.fieldname) {
      case 'profile':
        uploadPath = './storage/images/profile/';
        break;
      case 'image':
        uploadPath = './storage/images/teams';
        break;
      case 'policy':
        uploadPath = './storage/policies';
        break;
      case 'notice':
        uploadPath = './storage/notices';
        break;
      case 'excelsheet':
        uploadPath = './storage/excelsheet';
        break;
      case 'document':
        uploadPath = './storage/document';
        break;
      case 'aadhar':
        uploadPath = './storage/aadhar';
        break;
      case 'pan':
        uploadPath = './storage/pan';
        break;
      case 'bank':
        uploadPath = './storage/bank';
        break;
      default:
        return cb(new Error('Unsupported field name'), false);
    }


    ensureDirExists(uploadPath);
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/\s+/g, '_'); // Replace spaces
    cb(null, `${file.fieldname}-${uniqueSuffix}-${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file) {
    return cb(null, false);
  }

  if (file.fieldname === 'image') {
    if (['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype)) {
      return cb(null, true);
    } else {
      return cb(null, false);
    }
  }

  if (file.fieldname === 'video') {
    if (file.mimetype === 'video/mp4') {
      return cb(null, true);
    } else {
      return cb(null, false);
    }
  }

  // Accept all other file types (e.g., PDFs, docs)
  cb(null, true);
};

const upload = multer({ storage: storageEngine, fileFilter });

module.exports = upload;
