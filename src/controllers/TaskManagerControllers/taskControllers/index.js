const createTask = require('./createTask');
const readP = require('./readP');
const read = require('./read');
const readW = require('./readW');
const readT = require('./readT');
const updateTask = require('./update');
const remove = require('./remove');

const taskMethods = {
  create: createTask,
  read,
  readP,
  readT,
  readW,
  updateTask,
  remove,
};

module.exports = taskMethods;
