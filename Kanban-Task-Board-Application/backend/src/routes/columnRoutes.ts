import { Router } from 'express';
import {
  createColumn,
  getColumns,
  updateColumn,
  deleteColumn,
} from '../controllers/columnController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';

// mergeParams: true allows this router to access :projectId or :boardId from parent routers
const router = Router({ mergeParams: true });

//create: Only Admins and Members can add columns to a board
router.post(
  '/',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  createColumn,
);

//read: Viewers, Members, and Admins can all view the columns (Secured against IDOR)
router.get(
  '/',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN', 'PROJECT_MEMBER', 'PROJECT_VIEWER']),
  getColumns,
);

//update: Only Admins  can rename, change WIP limits, or reorder columns
router.put(
  '/:columnId',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  updateColumn,
);

//delete: Only Admins  can delete a column
router.delete(
  '/:columnId',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  deleteColumn,
);

export default router;
