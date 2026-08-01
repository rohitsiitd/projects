import express from 'express';
import {
  createProject,
  getProjects,
  projectArchive,
  updateProject,
  deleteProject,
  unarchiveProject,
} from '../controllers/ProjectControllers.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';
import { requireGlobalAdmin } from '../middleware/requireGlobalAdmin.js';
import {
  addMember,
  deleteMember,
  getMembers,
  updateMember,
} from '../controllers/manageMembers.js';
const router = express.Router();

router.patch(
  '/projects/:projectId',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  updateProject,
);
router.delete(
  '/projects/:projectId',
  authenticateJWT,
  deleteProject,
);
router.post('/projects/', authenticateJWT, requireGlobalAdmin, createProject);
router.get('/projects/:projectId', authenticateJWT, getProjects);
router.get('/projects', authenticateJWT, getProjects);
router.get('/projects/:projectId/members', authenticateJWT, getMembers);
router.post(
  '/projects/:projectId/archive',
  authenticateJWT,
  projectArchive,
);
router.post(
  '/projects/:projectId/unarchive',
  authenticateJWT,
  unarchiveProject,
);
router.post(
  '/projects/:projectId/members/:email',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  addMember,
);
router.delete(
  '/projects/:projectId/members/:email',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  deleteMember,
);
router.patch(
  '/projects/:projectId/members/:email/',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  updateMember,
);

export default router;
