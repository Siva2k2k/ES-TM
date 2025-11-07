import express from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { requireAuth } from '../middleware/auth';
import { query, param } from 'express-validator';

const router = express.Router();

// Validation middleware
const getNotificationsValidation = [
  query('type').optional().isString(),
  query('read').optional().isBoolean(),
  query('priority').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
];

const notificationIdValidation = [
  param('notification_id').isMongoId().withMessage('Invalid notification ID')
];

// Get user notifications
router.get('/', requireAuth, getNotificationsValidation, NotificationController.getNotifications);

// Get unread count (specific route before parameterized routes)
router.get('/unread-count', requireAuth, NotificationController.getUnreadCount);

// Mark all notifications as read (specific route before parameterized routes)
router.patch('/mark-all-read', requireAuth, NotificationController.markAllAsRead);
router.put('/mark-all-read', requireAuth, NotificationController.markAllAsRead);

// Mark notification as read (parameterized route)
router.patch('/:notification_id/read', requireAuth, notificationIdValidation, NotificationController.markAsRead);

// Mark notification as clicked (for analytics)
router.patch('/:notification_id/clicked', requireAuth, notificationIdValidation, NotificationController.markAsClicked);

// Delete notification
router.delete('/:notification_id', requireAuth, notificationIdValidation, NotificationController.deleteNotification);

// Delete multiple notifications
router.delete('/', requireAuth, NotificationController.deleteNotifications);

// Create notification (admin/system use)
router.post('/', requireAuth, NotificationController.createNotification);

export default router;