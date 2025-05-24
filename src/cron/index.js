const leaveCronJobs = require('./leaveCronJobs');

module.exports = () => {
  leaveCronJobs();  // Register leave-related cron tasks
};
