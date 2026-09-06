const pool = require('../db');

// ==========================================
// CREATE PROJECT
// ==========================================
const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      start_date,
      end_date,
      status,
      priority,
      budget,
      manager_id
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: 'Project name is required'
      });
    }

    const result = await pool.query(
      `INSERT INTO projects
      (
        name,
        description,
        start_date,
        end_date,
        status,
        priority,
        budget,
        manager_id,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        name,
        description || null,
        start_date || null,
        end_date || null,
        status || 'Planning',
        priority || 'Medium',
        budget || 0,
        manager_id || null,
        req.user.id
      ]
    );

    res.status(201).json({
      message: 'Project created successfully',
      project: result.rows[0]
    });

  } catch (error) {
    console.error('Create project error:', error);

    res.status(500).json({
      message: 'Failed to create project',
      error: error.message
    });
  }
};


// ==========================================
// GET ALL PROJECTS
// ==========================================
const getProjects = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        m.full_name AS manager_name,
        c.full_name AS created_by_name
      FROM projects p
      LEFT JOIN users m ON p.manager_id = m.id
      LEFT JOIN users c ON p.created_by = c.id
      ORDER BY p.created_at DESC
    `);

    res.status(200).json({
      count: result.rows.length,
      projects: result.rows
    });

  } catch (error) {
    console.error('Get projects error:', error);

    res.status(500).json({
      message: 'Failed to retrieve projects',
      error: error.message
    });
  }
};


// ==========================================
// GET SINGLE PROJECT
// ==========================================
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        p.*,
        m.full_name AS manager_name,
        c.full_name AS created_by_name
      FROM projects p
      LEFT JOIN users m ON p.manager_id = m.id
      LEFT JOIN users c ON p.created_by = c.id
      WHERE p.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    res.status(200).json({
      project: result.rows[0]
    });

  } catch (error) {
    console.error('Get project error:', error);

    res.status(500).json({
      message: 'Failed to retrieve project',
      error: error.message
    });
  }
};


// ==========================================
// UPDATE PROJECT
// ==========================================
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      start_date,
      end_date,
      status,
      priority,
      budget,
      manager_id
    } = req.body;

    const result = await pool.query(
      `
      UPDATE projects
      SET
        name = $1,
        description = $2,
        start_date = $3,
        end_date = $4,
        status = $5,
        priority = $6,
        budget = $7,
        manager_id = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
      `,
      [
        name,
        description || null,
        start_date || null,
        end_date || null,
        status,
        priority,
        budget || 0,
        manager_id || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    res.status(200).json({
      message: 'Project updated successfully',
      project: result.rows[0]
    });

  } catch (error) {
    console.error('Update project error:', error);

    res.status(500).json({
      message: 'Failed to update project',
      error: error.message
    });
  }
};


// ==========================================
// DELETE PROJECT
// ==========================================
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM projects
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    res.status(200).json({
      message: 'Project deleted successfully',
      project: result.rows[0]
    });

  } catch (error) {
    console.error('Delete project error:', error);

    res.status(500).json({
      message: 'Failed to delete project',
      error: error.message
    });
  }
};


// ==========================================
// UPDATE PROJECT STATUS
// ==========================================
const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Status is required'
      });
    }

    const result = await pool.query(
      `
      UPDATE projects
      SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    res.status(200).json({
      message: 'Project status updated successfully',
      project: result.rows[0]
    });

  } catch (error) {
    console.error('Update status error:', error);

    res.status(500).json({
      message: 'Failed to update project status',
      error: error.message
    });
  }
};


module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updateProjectStatus
};