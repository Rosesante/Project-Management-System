const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, authorizeRoles, authorizeTaskUpdate } = require('../middleware/authMiddleware');

// =====================================================
// CREATE COMMENT
// POST /api/comments
// =====================================================

router.post(
  '/',
  authenticateToken,
  async (req, res) => {
    try {
      const { content, task_id } = req.body;

      // Validate required fields
      if (!content || !task_id) {
        return res.status(400).json({
          error: 'Content and task_id are required'
        });
      }

      // Check if task exists
      const taskResult = await pool.query(
        'SELECT * FROM tasks WHERE id = $1',
        [task_id]
      );

      if (taskResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Task not found'
        });
      }

      // req.user.id comes from authenticateToken
      const user_id = req.user.id;

      const result = await pool.query(
        `INSERT INTO comments
          (content, task_id, user_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [content, task_id, user_id]
      );

      res.status(201).json({
        message: 'Comment created successfully',
        comment: result.rows[0]
      });

    } catch (err) {
      console.error('CREATE COMMENT ERROR:', err);

      res.status(500).json({
        error: err.message
      });
    }
  }
);


// =====================================================
// GET ALL COMMENTS
// GET /api/comments
// =====================================================

router.get(
  '/',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
          comments.id,
          comments.content,
          comments.task_id,
          comments.user_id,
          comments.created_at,
          comments.updated_at,
          users.username,
          tasks.title AS task_title
         FROM comments
         JOIN users ON comments.user_id = users.id
         JOIN tasks ON comments.task_id = tasks.id
         ORDER BY comments.created_at DESC`
      );

      res.json({
        comments: result.rows
      });

    } catch (err) {
      console.error('GET COMMENTS ERROR:', err);

      res.status(500).json({
        error: err.message
      });
    }
  }
);


// =====================================================
// GET COMMENTS FOR A SPECIFIC TASK
// GET /api/comments/task/:task_id
// =====================================================

router.get(
  '/task/:task_id',
  authenticateToken,
  async (req, res) => {
    try {
      const { task_id } = req.params;

      const result = await pool.query(
        `SELECT
          comments.id,
          comments.content,
          comments.task_id,
          comments.user_id,
          comments.created_at,
          comments.updated_at,
          users.username
         FROM comments
         JOIN users ON comments.user_id = users.id
         WHERE comments.task_id = $1
         ORDER BY comments.created_at ASC`,
        [task_id]
      );

      res.json({
        comments: result.rows
      });

    } catch (err) {
      console.error('GET TASK COMMENTS ERROR:', err);

      res.status(500).json({
        error: err.message
      });
    }
  }
);


// =====================================================
// GET ONE COMMENT
// GET /api/comments/:id
// =====================================================

router.get(
  '/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT
          comments.id,
          comments.content,
          comments.task_id,
          comments.user_id,
          comments.created_at,
          comments.updated_at,
          users.username,
          tasks.title AS task_title
         FROM comments
         JOIN users ON comments.user_id = users.id
         JOIN tasks ON comments.task_id = tasks.id
         WHERE comments.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Comment not found'
        });
      }

      res.json({
        comment: result.rows[0]
      });

    } catch (err) {
      console.error('GET COMMENT ERROR:', err);

      res.status(500).json({
        error: err.message
      });
    }
  }
);


// =====================================================
// UPDATE COMMENT
// PUT /api/comments/:id
// =====================================================

router.put(
  '/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          error: 'Content is required'
        });
      }

      // Find comment
      const commentResult = await pool.query(
        'SELECT * FROM comments WHERE id = $1',
        [id]
      );

      if (commentResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Comment not found'
        });
      }

      const comment = commentResult.rows[0];

      // Only the comment owner, Admin, or Project Manager can update
      if (
        req.user.role !== 'Admin' &&
        req.user.role !== 'Project Manager' &&
        req.user.id !== comment.user_id
      ) {
        return res.status(403).json({
          error: 'You are not authorized to update this comment'
        });
      }

      const result = await pool.query(
        `UPDATE comments
         SET
           content = $1,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [content, id]
      );

      res.json({
        message: 'Comment updated successfully',
        comment: result.rows[0]
      });

    } catch (err) {
      console.error('UPDATE COMMENT ERROR:', err);

      res.status(500).json({
        error: err.message
      });
    }
  }
);


// =====================================================
// DELETE COMMENT
// DELETE /api/comments/:id
// =====================================================

router.delete(
  '/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Find comment
      const commentResult = await pool.query(
        'SELECT * FROM comments WHERE id = $1',
        [id]
      );

      if (commentResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Comment not found'
        });
      }

      const comment = commentResult.rows[0];

      // Only owner, Admin, or Project Manager can delete
      if (
        req.user.role !== 'Admin' &&
        req.user.role !== 'Project Manager' &&
        req.user.id !== comment.user_id
      ) {
        return res.status(403).json({
          error: 'You are not authorized to delete this comment'
        });
      }

      await pool.query(
        'DELETE FROM comments WHERE id = $1',
        [id]
      );

      res.json({
        message: 'Comment deleted successfully'
      });

    } catch (err) {
      console.error('DELETE COMMENT ERROR:', err);

      res.status(500).json({
        error: err.message
      });
    }
  }
);


module.exports = router;