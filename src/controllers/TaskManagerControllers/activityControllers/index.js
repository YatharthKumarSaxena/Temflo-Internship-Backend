const read = require('./read');
const createActivity = require('./createActivity')

const activityMethods = {
  read,
  create: createActivity
};

module.exports = activityMethods;
