import express from 'express';
import { analyzeRequest } from '../analyzer/index.js';
import { createExecutionPlan } from '../orchestrator/index.js';
import { executeRequest } from '../executor/index.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Main request endpoint for processing user queries
router.post('/request', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    logger.info(`Processing request: ${query}`);
    
    // Step 1: Analyze the request to understand intent and requirements
    const analysis = await analyzeRequest(query);
    
    // Step 2: Create an execution plan based on the analysis
    const executionPlan = await createExecutionPlan(analysis);
    
    // Step 3: Execute the plan and get results
    const result = await executeRequest(executionPlan);
    
    res.json({
      query,
      analysis: analysis,
      executionPlan: executionPlan,
      result
    });
  } catch (error) {
    logger.error('Error processing request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to see available tools
router.get('/tools', async (req, res) => {
  try {
    const { registry } = await import('../registry/index.js');
    res.json(registry.getTools());
  } catch (error) {
    logger.error('Error fetching tools:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as apiRouter };