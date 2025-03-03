const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendThankYouEmail } = require('../utils/emailSender');

// POST endpoint to save survey responses
router.post('/', async (req, res) => {
  const timestamp = new Date().toISOString();
  const username = 'penguince';
  
  try {
    const { survey_id, respondent_name, respondent_email, answers } = req.body;
    
    // Validate required fields
    if (!survey_id || !respondent_name || !respondent_email || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        timestamp,
        username
      });
    }
    
    // Begin transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert response
      const responseResult = await client.query(
        `INSERT INTO responses (survey_id, respondent_name, respondent_email) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [survey_id, respondent_name, respondent_email]
      );
      
      const response_id = responseResult.rows[0].id;
      
      // Insert answers
      for (const answer of answers) {
        await client.query(
          `INSERT INTO answers (response_id, question_id, answer_value) 
           VALUES ($1, $2, $3)`,
          [response_id, answer.question_id, answer.answer_value]
        );
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Send thank you email
      console.log(`Sending thank you email to ${respondent_name} (${respondent_email})...`);
      const emailResult = await sendThankYouEmail(respondent_name, respondent_email);
      
      res.status(201).json({ 
        message: 'Survey response recorded successfully',
        response_id,
        email_sent: emailResult.success,
        timestamp,
        username
      });
      
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error saving survey response:', err);
    res.status(500).json({ 
      error: 'Failed to save survey response', 
      details: err.message,
      timestamp,
      username
    });
  }
});

module.exports = router;