const read = require('./read')
const readP = require('./readP');
const readT = require('./readT');
const update = require('./update');

const employeeTaskMethods = {
  read,
  readP,
  readT,
  update,
};

module.exports = employeeTaskMethods;
