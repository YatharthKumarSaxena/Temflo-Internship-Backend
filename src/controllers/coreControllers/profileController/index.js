const read = require('./read');
const UpdateController = require('./update');
const deleteInfo = require('./deleteInfo')

const UserMethods = {
  read,
  UpdateController,
  deleteInfo
};

module.exports = UserMethods;
