const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addComment
} = require('../controllers/taskController');

router.post('/', protect, createTask);
router.get('/', protect, getTasks);
router.get('/:taskId', protect, getTaskById);
router.put('/:taskId', protect, updateTask);
router.delete('/:taskId', protect, deleteTask);
router.post('/:taskId/comments', protect, addComment);

module.exports = router;
