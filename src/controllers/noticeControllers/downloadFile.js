const path = require('path');
const fs = require('fs');

const downloadFile = async (req, res, next) => {
  try {
    const { directory, filename } = req.params;

    // Sanitize directory and filename to prevent path traversal
    const safeDirectory = path.basename(directory);
    const safeFilename = path.basename(filename);

    const filePath = path.join(__dirname, '../../../storage', safeDirectory, safeFilename);

    // Optional: check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    return res.download(filePath);
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(500).json({ success: false, message: 'Failed to download file' });
  }
};

module.exports = downloadFile;
