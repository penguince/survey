const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all surveys
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM surveys ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching surveys:', err);
    res.status(500).json({ error: 'Failed to retrieve surveys' });
  }
});

// GET a specific survey by ID
router.get('/:id', async (req, res) => {
  try {
    const surveyResult = await db.query(
      'SELECT * FROM surveys WHERE id = $1',
      [req.params.id]
    );
    
    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    const questionsResult = await db.query(
      'SELECT * FROM questions WHERE survey_id = $1 ORDER BY order_num',
      [req.params.id]
    );
    
    const survey = surveyResult.rows[0];
    survey.questions = questionsResult.rows;
    
    res.json(survey);
  } catch (err) {
    console.error('Error fetching survey:', err);
    res.status(500).json({ error: 'Failed to retrieve survey' });
  }
});

// POST create new survey
router.post('/', async (req, res) => {
  // Get a client from the connection pool
  const client = await db.pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Extract data from request body
    const { title, description, created_by, questions } = req.body;
    
    // Validate required fields
    if (!title || !created_by || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Insert the survey
    const surveyResult = await client.query(
      'INSERT INTO surveys (title, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [title, description, created_by]
    );
    
    const survey = surveyResult.rows[0];
    
    // Insert all questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await client.query(
        'INSERT INTO questions (survey_id, question_text, question_type, options, required, order_num) VALUES ($1, $2, $3, $4, $5, $6)',
        [survey.id, q.question_text, q.question_type, q.options || null, q.required || false, i + 1]
      );
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    res.status(201).json(survey);
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error creating survey:', err);
    res.status(500).json({ error: 'Failed to create survey' });
  } finally {
    // Release the client back to the pool
    client.release();
  }
});

// PUT update survey
router.put('/:id', async (req, res) => {
  try {
    // Extract data from request body
    const { title, description } = req.body;
    
    // Update the survey
    const result = await db.query(
      'UPDATE surveys SET title = $1, description = $2 WHERE id = $3 RETURNING *',
      [title, description, req.params.id]
    );
    
    // Check if survey exists
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    // Return updated survey
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating survey:', err);
    res.status(500).json({ error: 'Failed to update survey' });
  }
});

// DELETE survey
router.delete('/:id', async (req, res) => {
  try {
    // Delete the survey (cascade delete will remove related questions)
    const result = await db.query(
      'DELETE FROM surveys WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    
    // Check if survey exists
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    // Return success message
    res.json({ message: 'Survey deleted successfully' });
  } catch (err) {
    console.error('Error deleting survey:', err);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

module.exports = router;