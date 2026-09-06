const jwt = require('jsonwebtoken');
const pool = require('../db');

const authenticateToken = (req, res, next) => {

  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {

    if (err) {
      return res.status(403).json({
        message: 'Invalid or expired token'
      });
    }

    req.user = user;

    next();

  });

};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

const authorizeTaskUpdate = async (req, res, next) => {
  try {
    const taskId = req.params.id;

    const result = await pool.query(
      'SELECT assigned_to FROM tasks WHERE id = $1',
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    const task = result.rows[0];

    // Admin and Project Manager can update any task
    if (
      req.user.role === 'Admin' ||
      req.user.role === 'Project Manager'
    ) {
      return next();
    }

    // Team Member can only update their assigned task
    if (
      req.user.role === 'Team Member' &&
      task.assigned_to === req.user.id
    ) {
      return next();
    }

    return res.status(403).json({
      message: 'Access denied. You can only update tasks assigned to you.'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

module.exports = {authenticateToken, authorizeRoles, authorizeTaskUpdate};