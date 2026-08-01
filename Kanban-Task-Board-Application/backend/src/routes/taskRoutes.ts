import { Router } from 'express';
import {
  createTask,
  getTask,
  getTasks,
  updateTask,
  moveTask,
  deleteTask,
} from '../controllers/taskController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';

// mergeParams allows nested routing i.e child can access parent params:
const router = Router({ mergeParams: true });

//create:
router.post(
  '/',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN', 'PROJECT_MEMBER']),
  createTask,
);

//read
router.get(
  '/',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN', 'PROJECT_MEMBER', 'PROJECT_VIEWER']),
  getTasks,
);

router.get(
  '/:taskId',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN', 'PROJECT_MEMBER', 'PROJECT_VIEWER']),
  getTask,
);

//update:
router.put(
  '/:taskId',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN', 'PROJECT_MEMBER']),
  updateTask,
);

//patch: for drag and drop
router.patch(
  '/:taskId/move',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN', 'PROJECT_MEMBER']),
  moveTask,
);

//delete:
router.delete(
  '/:taskId',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN', 'PROJECT_MEMBER']),
  deleteTask,
);

export default router;
