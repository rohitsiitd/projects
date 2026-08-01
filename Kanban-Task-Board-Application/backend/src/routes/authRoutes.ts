import express from 'express';
import {
  registerUser,
  loginUser,
  refreshUser,
  logoutUser,
  myProfile,
} from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = express.Router();

router.get('/myprofile', authenticateJWT, myProfile);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshUser);
router.post('/logout', logoutUser);

export default router;
