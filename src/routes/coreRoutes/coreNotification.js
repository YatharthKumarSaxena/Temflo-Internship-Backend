const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const notificationController = require('../../controllers/notificationControllers');

// Create notification (admin/owner only)
router.route('/create').post(catchErrors(notificationController.create));

// Get notifications list
router.route('/list').get(catchErrors(notificationController.list));

// Get unread count
router.route('/unread-count').get(catchErrors(notificationController.getUnreadCount));

// Mark notification as read
router.route('/mark-read/:id').patch(catchErrors(notificationController.markAsRead));

// Mark all notifications as read
router.route('/mark-all-read').patch(catchErrors(notificationController.markAllAsRead));

// Delete notification (admin/owner only)
router.route('/delete/:id').delete(catchErrors(notificationController.delete));

module.exports = router;
