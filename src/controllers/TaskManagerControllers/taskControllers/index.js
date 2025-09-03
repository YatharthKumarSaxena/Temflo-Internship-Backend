const createTask = require('./createTask');
const readP = require('./readP');
const read = require('./read');
const readW = require('./readW');
const readT = require('./readT');
const updateTask = require('./update');
const remove = require('./remove');
const paginatedList = require('./paginatedList');
const count = require('./count');
const uploadAttachment = require('./uploadAttachment');
const deleteAttachment = require('./deleteAttachment');

const taskMethods = {
  create: createTask,
  read,
  readP,
  readT,
  readW,
  paginatedList,
  updateTask,
  remove,
  count,
  uploadAttachment,
  deleteAttachment,
};

module.exports = taskMethods;
