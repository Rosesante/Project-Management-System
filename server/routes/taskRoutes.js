const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRoles, authorizeTaskUpdate } = require('../middleware/authMiddleware');

const router = express.Router();

// CREATE TASK
router.post(
  '/',
  authenticateToken,
  authorizeRoles('Admin', 'Project Manager'),
  async (req, res) => {
    try {
      const {
        title,
        description,
        status,
        priority,
        due_date,
        project_id,
        assigned_to
      } = req.body;

      if (!title || !project_id) {
        return res.status(400).json({
          error: 'Title and project_id are required'
        });
      }

      const result = await pool.query(
        `INSERT INTO tasks
        (title, description, status, priority, due_date, project_id, assigned_to)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          title,
          description || null,
          status || 'Pending',
          priority || 'Medium',
          due_date || null,
          project_id,
          assigned_to || null
        ]
      );

      res.status(201).json({
        message: 'Task created successfully',
        task: result.rows[0]
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: err.message
      });
    }
  }
);


// GET ALL TASKS
router.get('/', authenticateToken, async (req, res) => {
  try {
    let result;

    if (
      req.user.role === 'Admin' ||
      req.user.role === 'Project Manager'
    ) {
    result = await pool.query(`
      SELECT 
        tasks.*,
        projects.name AS project_name,
        users.full_name AS assigned_user
      FROM tasks
      JOIN projects ON tasks.project_id = projects.id
      LEFT JOIN users ON tasks.assigned_to = users.id
      ORDER BY tasks.created_at DESC
    `);
    } else if (req.user.role === 'Team Member') {
      result = await pool.query(`
        SELECT
          tasks.*,
          projects.name AS project_name,
          users.full_name AS assigned_user
        FROM tasks
        JOIN projects ON tasks.project_id = projects.id
        LEFT JOIN users ON tasks.assigned_to = users.id
        WHERE tasks.assigned_to = $1
        ORDER BY tasks.created_at DESC
      `, [req.user.id]);
    } else {
      return res.status(403).json({
        message: 'Access denied.'
      });
    }
    
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});


// GET ONE TASK
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        tasks.*,
        projects.name AS project_name,
        users.full_name AS assigned_user
      FROM tasks
      JOIN projects ON tasks.project_id = projects.id
      LEFT JOIN users ON tasks.assigned_to = users.id
      WHERE tasks.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Task not found'
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});


// UPDATE TASK
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('Admin', 'Project Manager'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        title,
        description,
        status,
        priority,
        due_date,
        project_id,
        assigned_to
      } = req.body;

      const result = await pool.query(
        `UPDATE tasks
        SET
          title = $1,
          description = $2,
          status = $3,
          priority = $4,
          due_date = $5,
          project_id = $6,
          assigned_to = $7
        WHERE id = $8
        RETURNING *`,
        [
          title,
          description,
          status,
          priority,
          due_date,
          project_id,
          assigned_to,
          id
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Task not found'
        });
      }

      res.json({
        message: 'Task updated successfully',
        task: result.rows[0]
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: err.message
      });
    }
  }
);


// DELETE TASK
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('Admin', 'Project Manager'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM tasks WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Task not found'
        });
      }

      res.json({
        message: 'Task deleted successfully',
        task: result.rows[0]
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: err.message
      });
    }
  }
);

module.exports = router;