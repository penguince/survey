const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

//test
console.log("Database connection info:");
console.log("- Host:", process.env.DB_HOST);
console.log("- Database:", process.env.DB_NAME);
console.log("- User:", process.env.DB_USER);
console.log("- Port:", process.env.DB_PORT);
console.log("- Password provided:", process.env.DB_PASSWORD ? "Yes" : "No");
console.log("- Current timestamp:", "2025-03-02 07:12:20");
console.log("- Current user:", "penguince");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Setup database tables
async function setupDatabase() {
    try {
      // Create surveys table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS surveys (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Surveys table created');
      
      // Create questions table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
          survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          question_type VARCHAR(50) NOT NULL,
          options JSONB,
          required BOOLEAN DEFAULT true,
          order_num INTEGER NOT NULL
        );
      `);
      console.log('Questions table created');
      
      // Create responses table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS responses (
          id SERIAL PRIMARY KEY,
          survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
          respondent_email VARCHAR(255),
          respondent_name VARCHAR(255),
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Responses table created');
      
      // Create answers table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS answers (
          id SERIAL PRIMARY KEY,
          response_id INTEGER REFERENCES responses(id) ON DELETE CASCADE,
          question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
          answer_value TEXT NOT NULL
        );
      `);
      console.log('Answers table created');

      // Insert Career Survey if it doesn't exist
      const surveyResult = await pool.query(`
        INSERT INTO surveys (title, description, created_by)
        SELECT 'Career Readiness Survey', 'A survey to assess career preparedness and planning', 'penguince'
        WHERE NOT EXISTS (SELECT 1 FROM surveys WHERE title = 'Career Readiness Survey')
        RETURNING id;
      `);
      
      // Get the survey ID (either newly inserted or existing)
      let surveyId;
      if (surveyResult.rows.length > 0) {
        surveyId = surveyResult.rows[0].id;
        console.log('Career survey created with ID:', surveyId);

        // Insert the 20 career survey questions
        const careerQuestions = [
          // Section 1: Career Awareness & Goals
          {
            text: "What type of career or industry are you most interested in pursuing?",
            type: "text",
            options: null,
            order: 1
          },
          {
            text: "Have you researched potential career paths that align with your major or skills?",
            type: "multiple_choice",
            options: JSON.stringify(["Yes", "No"]),
            order: 2
          },
          {
            text: "How confident are you in understanding the skills required for your desired job?",
            type: "range",
            options: JSON.stringify({min: 0, max: 10, labels: ["Not confident at all", "Extremely confident"]}),
            order: 3
          },
          {
            text: "Do you have a clear, long-term career plan?",
            type: "multiple_choice",
            options: JSON.stringify(["Yes", "No", "Somewhat, but I need more guidance"]),
            order: 4
          },
          {
            text: "Have you identified companies or organizations where you'd like to work?",
            type: "multiple_choice",
            options: JSON.stringify(["Yes", "No", "I have some ideas but haven't done research yet"]),
            order: 5
          },
          
          // Section 2: Resume, Cover Letter & Application Preparedness
          {
            text: "Do you have an updated and professional resume?",
            type: "multiple_choice",
            options: JSON.stringify(["Yes", "No"]),
            order: 6
          },
          {
            text: "Have you tailored your resume for specific job applications?",
            type: "multiple_choice",
            options: JSON.stringify([
              "Yes, for each application", 
              "Sometimes, but not always", 
              "No, I use a general resume for all applications"
            ]),
            order: 7
          },
          {
            text: "How confident are you in writing a compelling cover letter?",
            type: "range",
            options: JSON.stringify({min: 0, max: 10, labels: ["Not confident at all", "Extremely confident"]}),
            order: 8
          },
          {
            text: "Have you applied for internships or jobs related to your field?",
            type: "multiple_choice",
            options: JSON.stringify([
              "Yes, I've applied to multiple positions", 
              "Yes, but only a few", 
              "No, but I plan to start soon", 
              "No, I haven't applied yet"
            ]),
            order: 9
          },
          {
            text: "Have you received feedback on your resume from a career counselor, professor, or mentor?",
            type: "multiple_choice",
            options: JSON.stringify(["Yes", "No"]),
            order: 10
          },
          
          // Section 3: Interview & Networking Skills
          {
            text: "How comfortable are you with answering common interview questions?",
            type: "range",
            options: JSON.stringify({min: 0, max: 10, labels: ["Not comfortable at all", "Extremely comfortable"]}),
            order: 11
          },
          {
            text: "Have you participated in mock interviews?",
            type: "multiple_choice",
            options: JSON.stringify([
              "Yes, multiple times", 
              "Yes, once or twice", 
              "No, but I would like to", 
              "No, and I don't plan to"
            ]),
            order: 12
          },
          {
            text: "Do you have a LinkedIn profile that reflects your professional experience?",
            type: "multiple_choice",
            options: JSON.stringify([
              "Yes, and it is up-to-date", 
              "Yes, but it needs improvement", 
              "No, but I plan to create one", 
              "No, and I don't plan to"
            ]),
            order: 13
          },
          {
            text: "Have you attended career fairs, networking events, or industry meetups?",
            type: "multiple_choice",
            options: JSON.stringify([
              "Yes, multiple times", 
              "Yes, once or twice", 
              "No, but I plan to", 
              "No, and I don't see the value"
            ]),
            order: 14
          },
          {
            text: "Can you confidently introduce yourself and explain your career goals in 30 seconds (elevator pitch)?",
            type: "multiple_choice",
            options: JSON.stringify([
              "Yes, I have a strong elevator pitch", 
              "Somewhat, but I need practice", 
              "No, I don't have one yet"
            ]),
            order: 15
          },
          
          // Section 4: Job Market Understanding & Soft Skills
          {
            text: "Do you research job market trends and salary expectations in your field?",
            type: "multiple_choice",
            options: JSON.stringify([
              "Yes, regularly", 
              "Sometimes", 
              "No, but I know I should", 
              "No, I haven't thought about it"
            ]),
            order: 16
          },
          {
            text: "How well do you understand workplace professionalism, including communication and teamwork?",
            type: "range",
            options: JSON.stringify({min: 0, max: 10, labels: ["Not at all", "Extremely well"]}),
            order: 17
          },
          {
            text: "Have you developed a portfolio or personal website showcasing your work (if applicable)?",
            type: "multiple_choice",
            options: JSON.stringify([
              "Yes, and it's updated", 
              "Yes, but it needs improvement", 
              "No, but I plan to create one", 
              "No, and it's not necessary for my field"
            ]),
            order: 18
          },
          {
            text: "How comfortable are you with negotiating salary and job offers?",
            type: "range",
            options: JSON.stringify({min: 0, max: 10, labels: ["Not comfortable at all", "Extremely comfortable"]}),
            order: 19
          },
          {
            text: "Have you sought mentorship or guidance from professionals in your industry?",
            type: "multiple_choice",
            options: JSON.stringify([
              "Yes, I have one or more mentors", 
              "I have spoken to professionals but don't have a mentor", 
              "No, but I plan to seek guidance", 
              "No, and I don't think I need mentorship"
            ]),
            order: 20
          }
        ];

        // Insert each question
        for (const question of careerQuestions) {
          await pool.query(`
            INSERT INTO questions (survey_id, question_text, question_type, options, order_num)
            VALUES ($1, $2, $3, $4, $5)
          `, [surveyId, question.text, question.type, question.options, question.order]);
        }
        console.log('Inserted 20 career survey questions');
      } else {
        console.log('Career survey already exists, skipping question insertion');
      }
      
      console.log('Database setup completed successfully');
    } catch (err) {
      console.error('Error setting up database:', err);
    } finally {
      await pool.end();
    }
}

setupDatabase();