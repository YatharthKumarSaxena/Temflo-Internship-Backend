const createSubtask = require('./createSubtask');
const readP = require('./readP');
const read = require('./read');
const readW = require('./readW');
const readT = require('./readT');
const readS = require('./readS');
const updateTask = require('./update');
const remove = require('./remove');
const paginatedList = require('./paginatedList');
const count = require('./count');
const uploadAttachment = require('./uploadAttachment');
const deleteAttachment = require('./deleteAttachment');

const taskMethods = {
  create: createSubtask,
  read,
  readP,
  readT,
  readW,
  readS,
  updateTask,
  remove,
  paginatedList,
  count,
  uploadAttachment,
  deleteAttachment,
};

module.exports = taskMethods;
