

const createUser = require('./createUser')
const read = require('./read');
const remove = require('./remove');
const UpdateController = require('./update');
const paginatedList = require('./paginatedList');
const createBulk = require('./createBulk.js')

const UserMethods = {
  create: createUser,
  read,
  remove,
  UpdateController,
  paginatedList,
  createBulk
};

module.exports = UserMethods;
