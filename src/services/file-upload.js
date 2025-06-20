const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary'); // the file above

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folderName;

    switch (file.fieldname) {
      case 'profile':
        folderName = 'erpica/profile';
        break;
      case 'image':
        folderName = 'erpica/teams';
        break;
      case 'policy':
        folderName = 'erpica/policies';
        break;
      case 'notice':
        folderName = 'erpica/notices';
        break;
      case 'excelsheet':
        folderName = 'erpica/excelsheets';
        break;
      case 'document':
        folderName = 'erpica/documents';
        break;
      case 'aadhar':
        folderName = 'erpica/aadhar';
        break;
      case 'pan':
        folderName = 'erpica/pan';
        break;
      case 'bank':
        folderName = 'erpica/bank';
        break;
      default:
        folderName = 'erpica/others';
    }

    return {
      folder: folderName,
      public_id: `${file.fieldname}-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
    };
  }
});

const fileFilter = (req, file, cb) => {
  if (!file) return cb(null, false);

  if (file.fieldname === 'image' &&
    !['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype)) {
    return cb(null, false);
  }

  if (file.fieldname === 'video' && file.mimetype !== 'video/mp4') {
    return cb(null, false);
  }

  cb(null, true); // accept all others
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
