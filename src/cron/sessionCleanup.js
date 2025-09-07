const cron = require('node-cron');
const authService = require('@/services/authService');

// Session cleanup job - runs every hour
const sessionCleanupJob = cron.schedule(
  '0 * * * *',
  async () => {
    console.log('Starting session cleanup job...');

    try {
      // Clean up expired sessions for all user types
      const userModels = ['Admin', 'User']; // Add more user models as needed

      for (const userModel of userModels) {
        console.log(`Cleaning up sessions for ${userModel}...`);
        await authService.cleanupExpiredSessions(userModel);
      }

      console.log('Session cleanup job completed successfully');
    } catch (error) {
      console.error('Session cleanup job failed:', error);
    }
  },
  {
    scheduled: false, // Don't start automatically
    timezone: 'UTC',
  }
);

// Deep cleanup job - runs daily at 2 AM UTC
const deepCleanupJob = cron.schedule(
  '0 2 * * *',
  async () => {
    console.log('Starting deep cleanup job...');

    try {
      const mongoose = require('mongoose');

      const userModels = ['AdminPassword', 'UserPassword'];

      for (const modelName of userModels) {
        try {
          const Model = mongoose.model(modelName);

          // Clean up old password history (keep only last 5)
          const cleanupPasswordHistory = await Model.updateMany(
            { 'passwordHistory.5': { $exists: true } },
            {
              $push: {
                passwordHistory: {
                  $each: [],
                  $slice: -5, // Keep only last 5 passwords
                },
              },
            }
          );

          console.log(
            `Cleaned up password history for ${cleanupPasswordHistory.modifiedCount} ${modelName} records`
          );
        } catch (error) {
          console.error(`Error cleaning up ${modelName}:`, error);
        }
      }

      console.log('Deep cleanup job completed successfully');
    } catch (error) {
      console.error('Deep cleanup job failed:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'UTC',
  }
);

// Security audit job - runs daily at 3 AM UTC
const securityAuditJob = cron.schedule(
  '0 3 * * *',
  async () => {
    console.log('Starting security audit job...');

    try {
      const mongoose = require('mongoose');

      // Find accounts with multiple failed login attempts
      const userModels = ['AdminPassword', 'UserPassword'];

      for (const modelName of userModels) {
        try {
          const Model = mongoose.model(modelName);

          // Find accounts with too many active sessions
          const accountsWithManySessions = await Model.find({
            activeSessions: { $size: { $gte: 10 } },
          }).populate('user', 'email name');

          if (accountsWithManySessions.length > 0) {
            console.warn(
              `🚨 Security Alert: ${accountsWithManySessions.length} ${modelName} accounts with 10+ active sessions:`
            );
            accountsWithManySessions.forEach((account) => {
              console.warn(
                `- User: ${account.user?.email || 'Unknown'} - Active sessions: ${
                  account.activeSessions.length
                }`
              );
            });
          }
        } catch (error) {
          console.error(`Error in security audit for ${modelName}:`, error);
        }
      }

      console.log('Security audit job completed');
    } catch (error) {
      console.error('Security audit job failed:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'UTC',
  }
);

// Export functions to start/stop jobs
const startCleanupJobs = () => {
  console.log('Starting session cleanup jobs...');
  sessionCleanupJob.start();
  deepCleanupJob.start();
  securityAuditJob.start();

  // Run initial cleanup
  console.log('Running initial session cleanup...');
  setTimeout(async () => {
    try {
      await authService.cleanupExpiredSessions('Admin');
      await authService.cleanupExpiredSessions('User');
      console.log('Initial cleanup completed');
    } catch (error) {
      console.error('Initial cleanup failed:', error);
    }
  }, 5000); // Wait 5 seconds after startup
};

const stopCleanupJobs = () => {
  console.log('Stopping session cleanup jobs...');
  sessionCleanupJob.stop();
  deepCleanupJob.stop();
  securityAuditJob.stop();
};

module.exports = {
  startCleanupJobs,
  stopCleanupJobs,
  sessionCleanupJob,
  deepCleanupJob,
  securityAuditJob,
};
