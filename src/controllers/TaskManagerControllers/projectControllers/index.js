const createProject = require('./createProject');
const read = require('./read');
const readP = require('./readP');
const readW = require('./readW')
const updateProject = require('./update');
const remove = require('./remove');

const projectMethods = {
  create: createProject,
  read,
  readP,
  readW,
  updateProject,
  remove,
};

module.exports = projectMethods;
