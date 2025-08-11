const Notification = require('../models/coreModels/Notification');

class NotificationHelper {
  // Send notification to all users in a company
  static async sendNotificationToCompany(companyId, notificationData) {
    try {
      const notification = new Notification({
        companyId,
        ...notificationData,
        isActive: true,
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send feature update notification
  static async sendFeatureUpdateNotification(companyId, createdBy, featureData) {
    const notificationData = {
      title: `New Feature: ${featureData.name}`,
      message:
        featureData.description ||
        `A new feature "${featureData.name}" has been added to your system.`,
      type: 'feature_update',
      priority: featureData.priority || 'medium',
      targetUsers: featureData.targetUsers || ['all'],
      createdBy,
      metadata: {
        featureId: featureData.id,
        updateVersion: featureData.version,
        actionRequired: featureData.actionRequired || false,
        actionUrl: featureData.actionUrl || '',
        actionText: featureData.actionText || 'Learn More',
      },
    };

    return await this.sendNotificationToCompany(companyId, notificationData);
  }

  // Send system update notification
  static async sendSystemUpdateNotification(companyId, createdBy, updateData) {
    const notificationData = {
      title: `System Update: ${updateData.title}`,
      message: updateData.description,
      type: 'system_update',
      priority: updateData.priority || 'medium',
      targetUsers: ['all'],
      createdBy,
      metadata: {
        updateVersion: updateData.version,
        actionRequired: updateData.actionRequired || false,
        actionUrl: updateData.actionUrl || '',
        actionText: updateData.actionText || 'View Details',
      },
    };

    return await this.sendNotificationToCompany(companyId, notificationData);
  }

  // Send policy update notification
  static async sendPolicyUpdateNotification(companyId, createdBy, policyData) {
    const notificationData = {
      title: `Policy Update: ${policyData.title}`,
      message: policyData.description,
      type: 'policy_update',
      priority: 'medium',
      targetUsers: ['all'],
      createdBy,
      metadata: {
        actionRequired: true,
        actionUrl: policyData.url || '/policies',
        actionText: 'Review Policy',
      },
    };

    return await this.sendNotificationToCompany(companyId, notificationData);
  }

  // Send maintenance notification
  static async sendMaintenanceNotification(companyId, createdBy, maintenanceData) {
    const notificationData = {
      title: `Scheduled Maintenance: ${maintenanceData.title}`,
      message: maintenanceData.description,
      type: 'maintenance',
      priority: maintenanceData.priority || 'high',
      targetUsers: ['all'],
      createdBy,
      scheduledFor: maintenanceData.scheduledFor ? new Date(maintenanceData.scheduledFor) : null,
      metadata: {
        actionRequired: false,
      },
    };

    return await this.sendNotificationToCompany(companyId, notificationData);
  }

  // Send security notification
  static async sendSecurityNotification(companyId, createdBy, securityData) {
    const notificationData = {
      title: `Security Alert: ${securityData.title}`,
      message: securityData.description,
      type: 'security',
      priority: 'urgent',
      targetUsers: securityData.targetUsers || ['admin', 'owner'],
      createdBy,
      metadata: {
        actionRequired: securityData.actionRequired || true,
        actionUrl: securityData.actionUrl || '/security',
        actionText: securityData.actionText || 'Take Action',
      },
    };

    return await this.sendNotificationToCompany(companyId, notificationData);
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications() {
    try {
      const now = new Date();
      const result = await Notification.updateMany(
        {
          expiresAt: { $lt: now },
          isActive: true,
        },
        {
          isActive: false,
        }
      );

      return result;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  // Get notification statistics for a company
  static async getNotificationStats(companyId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { companyId, isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byType: {
              $push: {
                type: '$type',
                priority: '$priority',
              },
            },
            unreadCount: {
              $sum: {
                $cond: [{ $eq: [{ $size: '$isRead' }, 0] }, 1, 0],
              },
            },
          },
        },
      ]);

      return stats[0] || { total: 0, byType: [], unreadCount: 0 };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

module.exports = NotificationHelper;
