const express = require('express');

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updateProjectStatus
} = require('../controllers/projectController');

const {
  authenticateToken,
  authorizeRoles
} = require('../middleware/authMiddleware');

const router = express.Router();


// ==========================================
// CREATE PROJECT
// POST /api/projects
// ==========================================
router.post(
  '/',
  authenticateToken,
  authorizeRoles('Admin', 'Project Manager'),
  createProject
);


// ==========================================
// GET ALL PROJECTS
// GET /api/projects
// ==========================================
router.get(
  '/',
  authenticateToken,
  getProjects
);


// ==========================================
// GET SINGLE PROJECT
// GET /api/projects/:id
// ==========================================
router.get(
  '/:id',
  authenticateToken,
  getProjectById
);


// ==========================================
// UPDATE PROJECT
// PUT /api/projects/:id
// ==========================================
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('Admin', 'Project Manager'),
  updateProject
);


// ==========================================
// DELETE PROJECT
// DELETE /api/projects/:id
// ==========================================
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('Admin'),
  deleteProject
);


// ==========================================
// UPDATE PROJECT STATUS
// PATCH /api/projects/:id/status
// ==========================================
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('Admin', 'Project Manager'),
  updateProjectStatus
);


module.exports = router;