const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary'); // your configured Cloudinary instance

// Utility function to determine resource type
const getResourceType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'raw'; // for pdf, docx, pptx, xlsx, etc.
};

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
      case 'taskAttachment':
        folderName = 'erpica/task-attachments';
        break;
      case 'projectAttachment':
        folderName = 'erpica/project-attachments';
        break;
      case 'subtaskAttachment':
        folderName = 'erpica/subtask-attachments';
        break;  
      default:
        folderName = 'erpica/others';
    }

    return {
      folder: folderName,
      resource_type: getResourceType(file.mimetype), // important
      public_id: `${file.fieldname}-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
    };
  },
});

// Allow common MIME types (expandable)
const fileFilter = (req, file, cb) => {
  if (!file) return cb(null, false);

  const { fieldname, mimetype } = file;

  const allowedMimeTypes = [
    // Images
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/webp',
    'image/gif',

    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',

    // Documents
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/plain', // .txt
  ];

  if (!allowedMimeTypes.includes(mimetype)) {
    return cb(new Error('Unsupported file type'), false);
  }

  cb(null, true); // accept allowed types
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
