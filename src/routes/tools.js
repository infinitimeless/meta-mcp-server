import express from 'express';
import { registry } from '../registry/index.js';
import { generateToolDefinition, generateMcpServerTemplate } from '../utils/tool-generator.js';
import { createMcpServer } from '../executor/index.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Register a new tool
router.post('/register', async (req, res) => {
  try {
    const toolDefinition = req.body;
    
    if (!toolDefinition || !toolDefinition.name) {
      return res.status(400).json({ error: 'Tool definition must include at least a name' });
    }
    
    // Register the tool
    await registry.registerTool(toolDefinition);
    
    // If it's an MCP server, we might want to save the definition
    if (toolDefinition.type === 'mcp-server') {
      try {
        await generateToolDefinition(toolDefinition, 'js');
      } catch (error) {
        logger.warn('Failed to save tool definition file:', error);
        // Continue anyway since the tool is registered in memory
      }
    }
    
    res.json({
      success: true,
      message: `Tool ${toolDefinition.name} registered successfully`,
      toolId: toolDefinition.id
    });
  } catch (error) {
    logger.error('Error registering tool:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new MCP server
router.post('/create-server', async (req, res) => {
  try {
    const serverDefinition = req.body;
    
    if (!serverDefinition || !serverDefinition.name) {
      return res.status(400).json({ error: 'Server definition must include at least a name' });
    }
    
    // Create the MCP server
    const result = await createMcpServer(serverDefinition);
    
    // Generate a template implementation
    try {
      const serverDir = await generateMcpServerTemplate(serverDefinition);
      
      res.json({
        ...result,
        serverDir
      });
    } catch (error) {
      logger.warn('Failed to generate MCP server template:', error);
      
      // Return success anyway since the server was registered
      res.json(result);
    }
  } catch (error) {
    logger.error('Error creating MCP server:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all available tools
router.get('/', async (req, res) => {
  try {
    const tools = registry.getTools();
    res.json(tools);
  } catch (error) {
    logger.error('Error getting tools:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific tool by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tools = registry.getTools();
    const tool = tools.find(t => t.id === id);
    
    if (!tool) {
      return res.status(404).json({ error: `Tool ${id} not found` });
    }
    
    res.json(tool);
  } catch (error) {
    logger.error('Error getting tool:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as toolsRouter };