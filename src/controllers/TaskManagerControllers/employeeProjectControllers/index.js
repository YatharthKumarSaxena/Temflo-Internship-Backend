const read = require('./read');
const readP = require('./readP');
const readW = require('./readW');
const checkAccess = require('./checkAccess')

const employeeProjectMethods = {
  read,
  readP,
  readW,
  checkAccess
};

module.exports = employeeProjectMethods;
