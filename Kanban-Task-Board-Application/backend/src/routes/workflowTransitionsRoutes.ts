import { Router } from 'express';
import {
  getTransitions,
  updateTransitions,
  createTransition,
  deleteTransition,
} from '../controllers/workflowController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';

const router = Router({ mergeParams: true });

//Get the transition
router.get(
  '/',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN', 'PROJECT_MEMBER', 'PROJECT_VIEWER']),
  getTransitions,
);
//Updating the transitions:
router.put(
  '/',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  updateTransitions,
);

router.post(
  '/',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  createTransition,
);
router.delete(
  '/:id',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  deleteTransition,
);
export default router;
