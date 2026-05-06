const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

router.post('/', protect, createProject);
router.get('/', protect, getProjects);
router.get('/:projectId', protect, getProjectById);
router.put('/:projectId', protect, updateProject);
router.delete('/:projectId', protect, deleteProject);

module.exports = router;
