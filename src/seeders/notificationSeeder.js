// Dummy data for sending notifications
const Notification = require('../models/coreModels/Notification');
const User = require('../models/userModels/User');

const sampleNotifications = [
  {
    title: 'New Dashboard Feature Released',
    message:
      'We have released a new analytics dashboard that provides better insights into your business performance. Check it out now!',
    type: 'feature_update',
    priority: 'medium',
    targetUsers: ['all'],
    metadata: {
      featureId: 'dashboard-v2',
      updateVersion: '2.1.0',
      actionRequired: false,
      actionUrl: '/dashboard',
      actionText: 'View Dashboard',
    },
  },
  {
    title: 'Enhanced Security Measures',
    message:
      'We have implemented additional security measures to protect your data. Please review the new security settings.',
    type: 'security',
    priority: 'high',
    targetUsers: ['admin', 'owner'],
    metadata: {
      actionRequired: true,
      actionUrl: '/settings/security',
      actionText: 'Review Security',
    },
  },
  {
    title: 'System Maintenance Scheduled',
    message:
      'Scheduled maintenance will occur on Sunday from 2:00 AM to 4:00 AM UTC. The system may be temporarily unavailable.',
    type: 'maintenance',
    priority: 'high',
    targetUsers: ['all'],
    scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    metadata: {
      actionRequired: false,
    },
  },
  {
    title: 'Updated Privacy Policy',
    message:
      'Our privacy policy has been updated to comply with new regulations. Please review the changes.',
    type: 'policy_update',
    priority: 'medium',
    targetUsers: ['all'],
    metadata: {
      actionRequired: true,
      actionUrl: '/policies',
      actionText: 'Read Policy',
    },
  },
  {
    title: 'Performance Improvements',
    message:
      'We have made significant performance improvements to the application. Pages should load faster now.',
    type: 'system_update',
    priority: 'low',
    targetUsers: ['all'],
    metadata: {
      updateVersion: '2.0.5',
      actionRequired: false,
    },
  },
];

const seedNotifications = async () => {
  try {
    console.log('Starting notification seeding...');

    // Get all companies (user companyIds)
    const companies = await User.find({}, 'companyId').distinct('companyId');

    if (companies.length === 0) {
      console.log('No companies found. Please ensure users exist first.');
      return;
    }

    // Get the first user to use as creator
    const firstUser = await User.findOne({});
    if (!firstUser) {
      console.log('No user found to use as notification creator.');
      return;
    }

    let totalCreated = 0;

    for (const companyId of companies) {
      console.log(`Creating notifications for company: ${companyId}`);

      for (const notificationData of sampleNotifications) {
        const notification = new Notification({
          companyId: companyId,
          createdBy: firstUser._id,
          ...notificationData,
          isActive: true,
        });

        await notification.save();
        totalCreated++;
      }
    }

    console.log(
      `✅ Successfully created ${totalCreated} notifications for ${companies.length} companies`
    );
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
  }
};

module.exports = { seedNotifications, sampleNotifications };
