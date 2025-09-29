const leaveCronJobs = require('./leaveCronJobs');
const { startCleanupJobs } = require('./sessionCleanup');
const assetCronJobs = require("./assetCronJob");

module.exports = () => {
  leaveCronJobs(); // Register leave-related cron tasks
  startCleanupJobs(); // Start session cleanup and security jobs
  assetCronJobs();
};
