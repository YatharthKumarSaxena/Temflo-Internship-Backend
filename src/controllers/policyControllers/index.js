
const read = require('./read');
const remove = require('./remove');
const UpdateController = require('./update');
const downloadFile = require('./downloadFile')

const UserMethods = {
  read,
  remove,
  UpdateController,
  downloadFile,
};

module.exports = UserMethods;
