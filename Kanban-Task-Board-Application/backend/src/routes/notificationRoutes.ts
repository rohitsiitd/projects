import { Router } from 'express';
import {
  getUserNotifications,
  readNotfications,
} from '../controllers/notificationController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();

router.get('/', authenticateJWT, getUserNotifications);
router.put('/:notificationId/read', authenticateJWT, readNotfications);

export default router;
