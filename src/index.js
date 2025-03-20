import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { apiRouter } from './routes/api.js';
import { initializeRegistry } from './registry/index.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api', apiRouter);

// Simple health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Meta MCP Server is running' });
});

// Initialize the tool registry
initializeRegistry()
  .then(() => {
    // Start the server
    app.listen(port, () => {
      logger.info(`Meta MCP Server listening on port ${port}`);
    });
  })
  .catch(err => {
    logger.error('Failed to initialize the tool registry:', err);
    process.exit(1);
  });