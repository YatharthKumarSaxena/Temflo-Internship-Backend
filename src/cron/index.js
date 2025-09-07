const leaveCronJobs = require('./leaveCronJobs');
const { startCleanupJobs } = require('./sessionCleanup');

module.exports = () => {
  leaveCronJobs(); // Register leave-related cron tasks
  startCleanupJobs(); // Start session cleanup and security jobs
};
