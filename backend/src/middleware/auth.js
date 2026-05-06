const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'team-task-manager-dev-secret';

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

exports.validateTeamMember = async (req, res, next) => {
  try {
    const Team = require('../models/Team');
    const team = await Team.findById(req.params.teamId);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const isMember = team.members.some(member => member.userId.toString() === req.user.id) || 
                    team.admin.toString() === req.user.id;

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not a team member'
      });
    }

    req.team = team;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
