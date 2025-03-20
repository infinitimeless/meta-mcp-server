import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

// Initialize registry as a singleton
class ToolRegistry {
  constructor() {
    this.tools = [];
    this.lastScanTime = null;
  }

  getTools() {
    return this.tools;
  }

  async registerTool(tool) {
    // Check if tool already exists
    const existingTool = this.tools.find(t => t.id === tool.id);
    
    if (existingTool) {
      // Update existing tool
      Object.assign(existingTool, tool);
      logger.info(`Updated tool: ${tool.name} (${tool.id})`);
    } else {
      // Add new tool
      this.tools.push(tool);
      logger.info(`Registered new tool: ${tool.name} (${tool.id})`);
    }
  }

  async scanForTools() {
    try {
      const toolsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../tools');
      
      // Ensure the directory exists
      try {
        await fs.access(toolsDir);
      } catch (error) {
        logger.info('Tools directory does not exist. Creating it...');
        await fs.mkdir(toolsDir, { recursive: true });
        return; // No tools to scan yet
      }
      
      const files = await fs.readdir(toolsDir);
      
      // Find all tool definition files
      const toolFiles = files.filter(file => 
        file.endsWith('.tool.json') || file.endsWith('.tool.js')
      );
      
      for (const file of toolFiles) {
        try {
          if (file.endsWith('.tool.json')) {
            // Load JSON definition
            const toolPath = path.join(toolsDir, file);
            const toolData = await fs.readFile(toolPath, 'utf8');
            const tool = JSON.parse(toolData);
            await this.registerTool(tool);
          } else if (file.endsWith('.tool.js')) {
            // Load JS module
            const modulePath = path.join(toolsDir, file);
            const module = await import(`file://${modulePath}`);
            
            if (module.default && typeof module.default === 'object') {
              await this.registerTool(module.default);
            } else {
              logger.warn(`Tool module ${file} does not export a default tool definition`);
            }
          }
        } catch (error) {
          logger.error(`Error loading tool from ${file}:`, error);
        }
      }
      
      this.lastScanTime = new Date();
      logger.info(`Scanned for tools. Found ${this.tools.length} tools.`);
    } catch (error) {
      logger.error('Error scanning for tools:', error);
    }
  }
}

// Create singleton instance
export const registry = new ToolRegistry();

// Initialize the registry
export async function initializeRegistry() {
  await registry.scanForTools();
  
  // Set up periodic scanning if enabled
  if (process.env.TOOL_DISCOVERY_ENABLED === 'true') {
    const interval = parseInt(process.env.REGISTRY_SCAN_INTERVAL || '3600000', 10);
    
    setInterval(() => {
      registry.scanForTools();
    }, interval);
    
    logger.info(`Tool discovery enabled. Will scan every ${interval}ms.`);
  }
  
  return registry;
}