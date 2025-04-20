

const createUser = require('./createUser')
const read = require('./read');
const remove = require('./remove');
// const update = require('./update');
const paginatedList = require('./paginatedList');

const UserMethods = {
  create: createUser,
  read,
  remove,
  // update,
  paginatedList
};

module.exports = UserMethods;
