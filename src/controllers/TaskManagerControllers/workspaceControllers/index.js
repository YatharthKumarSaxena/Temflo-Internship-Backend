const createWorkspace = require('./createWorkspace');
const paginatedList = require('./paginatedList');
const read = require('./read');
const readW = require('./readW');
const remove = require('./remove');
const updateWorkspace = require('./update');

const workspaceMethods = {
  create: createWorkspace,
  paginatedList,
  read,
  readW,
  updateWorkspace,
  remove,
};

module.exports = workspaceMethods;
