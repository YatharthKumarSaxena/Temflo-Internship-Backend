

const createUser = require('./createUser')
const read = require('./read');
const remove = require('./remove');
const UpdateController = require('./update');
const paginatedList = require('./paginatedList');

const UserMethods = {
  create: createUser,
  read,
  remove,
  UpdateController,
  paginatedList
};

module.exports = UserMethods;
