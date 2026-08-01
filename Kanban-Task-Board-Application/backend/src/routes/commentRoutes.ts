import { Router } from 'express';
import {
  createComment,
  updateComment,
  deleteComment,
  getComments,
} from '../controllers/commentController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';

const router = Router({ mergeParams: true });
router.get(
  '/',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN', 'PROJECT_MEMBER', 'PROJECT_VIEWER']),
  getComments,
);
//Creating Comment
router.post(
  '/',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN', 'PROJECT_MEMBER']),
  createComment,
);

//Updating Comment
router.put(
  '/:commentId',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN', 'PROJECT_MEMBER']),
  updateComment,
);

//Deleting comment
router.delete(
  '/:commentId',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN', 'PROJECT_MEMBER']),
  deleteComment,
);

export default router;
