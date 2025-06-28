

const createUser = require('./createUser')
const read = require('./read');
const remove = require('./remove');
const UpdateController = require('./update');
const paginatedList = require('./paginatedList');
const createBulk = require('./createBulk.js')
const downloadFile = require('./downloadFile')
const deleteInfo = require('./deleteInfo')
const dashboardInfoController = require('./dashboardInfo')
const {countUsers,countPlants,countAssets} = require('./count')

const UserMethods = {
  create: createUser,
  read,
  remove,
  UpdateController,
  dashboardInfoController,
  paginatedList,
  createBulk,
  countUsers,
  countPlants,
  downloadFile,
  deleteInfo,
  countAssets
};

module.exports = UserMethods;
