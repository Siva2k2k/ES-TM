import { Router } from 'express';
import { User } from '../models';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'MongoDB Connected' 
  });
});

// Test database connection
router.get('/users/count', asyncHandler(async (req, res) => {
  const count = await User.countDocuments();
  res.json({ 
    success: true,
    data: { userCount: count },
    message: 'User count retrieved successfully'
  });
}));

// Get all users (for testing)
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find().select('-password_hash');
  res.json({ 
    success: true,
    data: { users },
    count: users.length
  });
}));

export default router;