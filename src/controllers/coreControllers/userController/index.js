

const createUser = require('./createUser')
const read = require('./read');
const remove = require('./remove');
const UpdateController = require('./update');
const paginatedList = require('./paginatedList');
const createBulk = require('./createBulk.js')
const {countUsers,countPlants} = require('./count')

const UserMethods = {
  create: createUser,
  read,
  remove,
  UpdateController,
  paginatedList,
  createBulk,
  countUsers,
  countPlants
};

module.exports = UserMethods;
