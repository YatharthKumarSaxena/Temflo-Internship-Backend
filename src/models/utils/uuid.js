const { v4: uuidv4 } = require("uuid");

function generateTaskCode() {
  return `task-${uuidv4().replace(/-/g, "").substring(0, 3)}`;
}

module.exports = {
  generateTaskCode
};
