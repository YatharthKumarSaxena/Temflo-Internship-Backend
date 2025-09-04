const read = require('./read')
const readP = require('./readP');
const readT = require('./readT');
const readS = require('./readS');
const update = require('./update');

const employeeSubtaskMethods = {
  read,
  readP,
  readT,
  readS,
  update
};

module.exports = employeeSubtaskMethods;
