require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const {authenticateToken, authorizeRoles} = require('./middleware/authMiddleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user
  }); 

});  

app.post(
  '/api/projects',
  authenticateToken,
  authorizeRoles('Admin', 'Project Manager'),
  (req, res) => {
    res.json({
      message: 'Project created successfully',
      createdBy: req.user
    });
  }
);


const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
 