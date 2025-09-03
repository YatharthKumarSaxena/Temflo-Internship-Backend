const multer = require('multer');
const path = require('path');
const { slugify } = require('transliteration');

const fileFilter = require('./utils/LocalfileFilter');

// Security configuration for file uploads
const securityConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  blockedExtensions: [
    '.exe',
    '.bat',
    '.cmd',
    '.com',
    '.pif',
    '.scr',
    '.vbs',
    '.js',
    '.php',
    '.asp',
    '.aspx',
  ],
};

const singleStorageUpload = ({
  entity,
  fileType = 'default',
  uploadFieldName = 'file',
  fieldName = 'file',
}) => {
  var diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `src/public/uploads/${entity}`);
    },
    filename: function (req, file, cb) {
      try {
        // fetching the file extension of the uploaded file
        let fileExtension = path.extname(file.originalname);
        let uniqueFileID = Math.random().toString(36).slice(2, 7); // generates unique ID of length 5

        let originalname = '';
        if (req.body.seotitle) {
          originalname = slugify(req.body.seotitle.toLocaleLowerCase()); // convert any language to English characters
        } else {
          originalname = slugify(file.originalname.split('.')[0].toLocaleLowerCase()); // convert any language to English characters
        }

        let _fileName = `${originalname}-${uniqueFileID}${fileExtension}`;

        const filePath = `public/uploads/${entity}/${_fileName}`;
        // saving file name and extension in request upload object
        req.upload = {
          fileName: _fileName,
          fieldExt: fileExtension,
          entity: entity,
          fieldName: fieldName,
          fileType: fileType,
          filePath: filePath,
        };

        req.body[fieldName] = filePath;

        cb(null, _fileName);
      } catch (error) {
        cb(error); // pass the error to the callback
      }
    },
  });

  let filterType = fileFilter(fileType);

  // Enhanced security configuration for multer
  const multerStorage = multer({
    storage: diskStorage,
    fileFilter: filterType,
    limits: {
      fileSize: securityConfig.maxFileSize,
      files: 1,
    },
    fileFilter: (req, file, cb) => {
      // Check file size
      if (file.size > securityConfig.maxFileSize) {
        return cb(new Error('File size too large. Maximum allowed is 10MB.'), false);
      }

      // Check MIME type
      if (!securityConfig.allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('File type not allowed.'), false);
      }

      // Check file extension
      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (securityConfig.blockedExtensions.includes(fileExtension)) {
        return cb(new Error('File extension not allowed for security reasons.'), false);
      }

      // Apply original file filter
      return filterType(req, file, cb);
    },
  }).single('file');

  return multerStorage;
};

module.exports = singleStorageUpload;
