import { Router } from 'express';
import {
  getUsers,
  updateAvatar,
  updateUserGlobalRole,
} from '../controllers/userController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { uploadAvatar } from '../middleware/uploadAvatar.js';

const router = Router();

router.get('/', authenticateJWT, getUsers);

router.patch('/:id/role', authenticateJWT, updateUserGlobalRole);

router.patch(
  '/avatars',
  authenticateJWT,
  uploadAvatar.single('avatar'),
  updateAvatar,
);

export default router;
