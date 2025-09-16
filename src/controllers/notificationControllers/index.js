const { NOTIFICATION_CREATED, NOTIFICATION_DELETED, NOTIFICATION_MARKED_ALL_AS_READ, NOTIFICATION_MARKED_AS_READ } = require('@/config/activity.enums');
const Notification = require('../../models/coreModels/Notification');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");

class NotificationController {
  // Create a new notification
  create = async (req, res) => {
    try {
      const { title, message, type, priority, targetUsers, scheduledFor, expiresAt, metadata } =
        req.body;

      if (!title || !message || !type) {
        return res.status(400).json({
          success: false,
          message: 'Title, message, and type are required',
        });
      }

      const notification = new Notification({
        companyId: req.admin.companyId,
        title,
        message,
        type,
        priority: priority || 'medium',
        targetUsers: targetUsers || ['all'],
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        metadata: metadata || {},
        createdBy: req.admin._id,
      });

      await notification.save();

      // 🟢 Activity Tracker: Notification Created
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.notification,
        subModuleAffected: null,
        fileAffected: FILE.file_index,
        modelAffected: [MODEL_AFFECTED.model_notification],
        eventType: NOTIFICATION_CREATED,
        actionDone: ACTIONS.create,
        oldData: null,
        newData: notification.toObject(),
      });

      return res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        notification,
      });
    } catch (error) {
      console.error('Create notification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  };

  // Get notifications for current user
  list = async (req, res) => {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      const userRole = req.admin.role;
      const userId = req.admin._id;

      const currentTime = new Date();

      // Build query with proper $and/$or logic
      const query = {
        companyId: req.admin.companyId,
        isActive: true,
        $and: [
          { $or: [{ scheduledFor: null }, { scheduledFor: { $lte: currentTime } }] },
          { $or: [{ expiresAt: null }, { expiresAt: { $gte: currentTime } }] },
          { $or: [{ targetUsers: 'all' }, { targetUsers: userRole }] },
        ],
      };

      // If unreadOnly is true, filter out read notifications
      if (unreadOnly === 'true') {
        query['isRead.userId'] = { $ne: userId };
      }

      const notifications = await Notification.find(query)
        .populate('createdBy', 'name surname email')
        .sort({ priority: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Add read status for each notification
      const notificationsWithReadStatus = notifications.map((notification) => {
        const isRead = notification.isRead.some(
          (read) => read.userId.toString() === userId.toString()
        );
        return {
          ...notification.toObject(),
          isReadByUser: isRead,
        };
      });

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({
        ...query,
        'isRead.userId': { $ne: userId },
      });

      return res.status(200).json({
        success: true,
        notifications: notificationsWithReadStatus,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: total,
        },
        unreadCount,
      });
    } catch (error) {
      console.error('List notifications error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  // Mark notification as read
  markAsRead = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.admin._id;

      const notification = await Notification.findOneAndUpdate(
        {
          _id: id,
          companyId: req.admin.companyId,
          'isRead.userId': { $ne: userId },
        },
        {
          $push: {
            isRead: {
              userId: userId,
              readAt: new Date(),
            },
          },
        },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or already read',
        });
      }

      // ✅ Activity Tracker Integration
      await activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.notification,
        subModuleAffected: null,
        fileAffected: FILE.file_index,
        modelAffected: [MODEL_AFFECTED.model_notification],
        eventType: NOTIFICATION_MARKED_AS_READ,
        oldData: { _id: id, isRead: notification.isRead.slice(0, -1) }, // Before marking
        newData: { isRead: notification.isRead },             // After marking
      });

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  // Mark all notifications as read
  markAllAsRead = async (req, res) => {
    try {
      const userId = req.admin._id;
      const userRole = req.admin.role;
      const currentTime = new Date();

      const notificationsToUpdate = await Notification.find({
        companyId: req.admin.companyId,
        isActive: true,
        $or: [{ scheduledFor: null }, { scheduledFor: { $lte: currentTime } }],
        $or: [{ expiresAt: null }, { expiresAt: { $gte: currentTime } }],
        $or: [{ targetUsers: 'all' }, { targetUsers: userRole }],
        'isRead.userId': { $ne: userId },
      });

      const oldData = notificationsToUpdate.map(n => ({ _id: n._id, isRead: n.isRead }));

      await Notification.updateMany(
        {
          _id: { $in: notificationsToUpdate.map(n => n._id) }
        },
        {
          $push: {
            isRead: {
              userId: userId,
              readAt: new Date(),
            },
          },
        }
      );

      // ✅ Activity Tracker Integration
      await activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.notification,
        subModuleAffected: null,
        fileAffected: FILE.file_index,
        modelAffected: [MODEL_AFFECTED.model_notification],
        eventType: NOTIFICATION_MARKED_ALL_AS_READ,
        oldData: oldData,
        newData: 'All marked as read by user',
      });

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  // Get unread count
  getUnreadCount = async (req, res) => {
    try {
      const userId = req.admin._id;
      const userRole = req.admin.role;
      const currentTime = new Date();

      const count = await Notification.countDocuments({
        companyId: req.admin.companyId,
        isActive: true,
        $or: [{ scheduledFor: null }, { scheduledFor: { $lte: currentTime } }],
        $or: [{ expiresAt: null }, { expiresAt: { $gte: currentTime } }],
        $or: [{ targetUsers: 'all' }, { targetUsers: userRole }],
        'isRead.userId': { $ne: userId },
      });

      return res.status(200).json({
        success: true,
        unreadCount: count,
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;

      if (!['admin', 'owner'].includes(req.admin.role)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to delete notifications',
        });
      }

      const notification = await Notification.findOneAndUpdate(
        { _id: id, companyId: req.admin.companyId },
        { isActive: false },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      // ✅ Activity Tracker Integration
      await activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.notification,
        subModuleAffected: null,
        fileAffected: FILE.file_index,
        modelAffected: [MODEL_AFFECTED.model_notification],
        eventType: NOTIFICATION_DELETED,
        oldData: {
          _id: id,
          isActive: true
        },
        newData: {
          isActive: false
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}

module.exports = new NotificationController();
