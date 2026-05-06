const Task = require('../models/Task');
const Project = require('../models/Project');

exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo, tags } = req.body;
    const { projectId } = req.params;

    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title and due date are required'
      });
    }

    const project = await Project.findById(projectId).populate('team');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.team.admin.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can create tasks'
      });
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      priority,
      dueDate,
      assignedTo,
      createdBy: req.user.id,
      tags,
      isOverdue: new Date(dueDate) < new Date()
    });

    await Project.findByIdAndUpdate(projectId, {
      $push: { tasks: task._id }
    });

    const populatedTask = await task.populate('assignedTo createdBy');

    res.status(201).json({
      success: true,
      task: populatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignedTo } = req.query;

    let filter = { project: projectId };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo')
      .populate('createdBy');

    res.status(200).json({
      success: true,
      tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignedTo')
      .populate('createdBy')
      .populate('comments.user');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate, tags } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (assignedTo) task.assignedTo = assignedTo;
    if (dueDate) {
      task.dueDate = dueDate;
      task.isOverdue = new Date(dueDate) < new Date() && task.status !== 'Completed';
    }
    if (tags) task.tags = tags;

    await task.save();
    const populatedTask = await task.populate('assignedTo createdBy');

    res.status(200).json({
      success: true,
      task: populatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await Project.findByIdAndUpdate(task.project, {
      $pull: { tasks: task._id }
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.comments.push({
      user: req.user.id,
      content
    });

    await task.save();
    const populatedTask = await task.populate('comments.user');

    res.status(200).json({
      success: true,
      task: populatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
