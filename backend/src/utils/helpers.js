const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'team-task-manager-dev-secret';

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Using a development fallback secret.');
}

exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

exports.comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

exports.generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

exports.calculateTaskMetrics = (tasks) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const overdue = tasks.filter(t => t.isOverdue && t.status !== 'Completed').length;

  return {
    total,
    completed,
    inProgress,
    overdue,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};

exports.calculateProjectProgress = (tasks) => {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  return Math.round((completed / tasks.length) * 100);
};
