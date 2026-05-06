const Project = require('../models/Project');
const Task = require('../models/Task');
const { calculateProjectProgress } = require('../utils/helpers');

exports.createProject = async (req, res) => {
  try {
    const { name, description, dueDate, priority, color } = req.body;
    const { teamId } = req.params;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
    }

    const team = await require('../models/Team').findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (team.admin.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can create projects'
      });
    }

    const project = await Project.create({
      name,
      description,
      team: teamId,
      owner: req.user.id,
      dueDate,
      priority,
      color
    });

    await require('../models/Team').findByIdAndUpdate(teamId, {
      $push: { projects: project._id }
    });

    res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const { teamId } = req.params;

    const projects = await Project.find({ team: teamId })
      .populate('owner')
      .populate('tasks');

    res.status(200).json({
      success: true,
      projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner')
      .populate({
        path: 'tasks',
        populate: 'assignedTo createdBy'
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const progress = calculateProjectProgress(project.tasks);

    res.status(200).json({
      success: true,
      project: {
        ...project.toObject(),
        progress
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, description, status, priority, dueDate, color } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;
    if (priority) project.priority = priority;
    if (dueDate) project.dueDate = dueDate;
    if (color) project.color = color;

    await project.save();

    res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await Task.deleteMany({ project: project._id });

    res.status(200).json({
      success: true,
      message: 'Project deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
