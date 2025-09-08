const createMember = require('./createMember');
const readP = require('./readP');
const readW = require('./readW');
const remove = require('./remove');

const memberMethods = {
  create: createMember,
  readP,
  readW,
  remove,
};

module.exports = memberMethods;
