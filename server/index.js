const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const net = require('net');

// Load environment variables
dotenv.config();

// Function to check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Function to find an available port
async function findAvailablePort(startPort) {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    console.log(`Port ${port} is not available, trying next port...`);
    port++;
    if (port > startPort + 100) {
      throw new Error('Could not find an available port after 100 attempts');
    }
  }
  return port;
}

// Initialize express
const app = express();

// Add debug logging
console.log("Server starting up...");

// Import database connection
try {
  const db = require('./db');
  console.log("Database module loaded successfully");
} catch (error) {
  console.error("Error loading database module:", error);
  process.exit(1); // Exit if database can't connect
}

// More debug logging
console.log("Setting up middleware...");

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
try {
  const surveyRoutes = require('./routes/surveys');
  console.log("Survey routes loaded successfully");
  app.use('/api/surveys', surveyRoutes);
} catch (error) {
  console.error("Error loading survey routes:", error);
}

// Import response routes for the email functionality
try {
  const responseRoutes = require('./routes/responses');
  console.log("Response routes loaded successfully");
  app.use('/api/responses', responseRoutes);
} catch (error) {
  console.error("Error loading response routes:", error);
}

// Simple test route with detailed logging
app.get('/api/test', (req, res) => {
  console.log("Test route accessed");
  res.json({ 
    message: 'API server is running!',
    timestamp: new Date().toISOString(),
    user: 'penguince',
    currentTime: '2025-03-02 22:37:21'  // Updated timestamp
  });
});

// Start server with explicit error handling and port finding
(async () => {
  try {
    const startPort = parseInt(process.env.PORT || '3000');
    const PORT = await findAvailablePort(startPort);
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ API available at http://localhost:${PORT}/api/test`);
      console.log(`✅ API surveys available at http://localhost:${PORT}/api/surveys`);
      console.log(`✅ API responses available at http://localhost:${PORT}/api/responses`);
      console.log(`✅ Database connected successfully at: ${new Date().toISOString()}`);
    });
    
    // Add error handler for the server
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
})();