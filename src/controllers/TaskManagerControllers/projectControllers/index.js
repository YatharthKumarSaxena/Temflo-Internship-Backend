const createProject = require('./createProject');
const read = require('./read');
const readP = require('./readP');
const readW = require('./readW')
const updateProject = require('./update');
const remove = require('./remove');
const paginatedList = require('./paginatedList');
const uploadAttachment = require('./uploadAttachment');
const deleteAttachment = require('./deleteAttachment');

const projectMethods = {
  create: createProject,
  read,
  readP,
  readW,
  updateProject,
  remove,
  paginatedList,
  uploadAttachment,
  deleteAttachment,
};

module.exports = projectMethods;
