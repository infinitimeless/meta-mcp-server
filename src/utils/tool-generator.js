import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Creates a new MCP tool definition file based on a template.
 * 
 * @param {Object} definition The tool definition
 * @param {string} outputFormat The output format ('js' or 'json')
 * @returns {Promise<string>} The path to the created file
 */
export async function generateToolDefinition(definition, outputFormat = 'js') {
  try {
    // Ensure the tools directory exists
    const toolsDir = path.join(__dirname, '../tools');
    
    try {
      await fs.access(toolsDir);
    } catch (error) {
      logger.info('Tools directory does not exist. Creating it...');
      await fs.mkdir(toolsDir, { recursive: true });
    }
    
    // Generate a tool ID if one wasn't provided
    if (!definition.id) {
      definition.id = definition.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    
    // Set default values if not provided
    const toolDef = {
      version: '0.1.0',
      type: 'mcp-server',
      ...definition
    };
    
    // Create the output file path
    const fileName = `${toolDef.id}.tool.${outputFormat}`;
    const filePath = path.join(toolsDir, fileName);
    
    // Create the file content
    let fileContent;
    
    if (outputFormat === 'js') {
      fileContent = `/**
 * MCP tool definition for ${toolDef.name}
 */

export default ${JSON.stringify(toolDef, null, 2)};`;
    } else {
      fileContent = JSON.stringify(toolDef, null, 2);
    }
    
    // Write the file
    await fs.writeFile(filePath, fileContent);
    
    logger.info(`Generated tool definition file: ${fileName}`);
    
    return filePath;
  } catch (error) {
    logger.error('Error generating tool definition:', error);
    throw error;
  }
}

/**
 * Creates a new MCP server implementation based on a template.
 * 
 * @param {Object} definition The MCP server definition
 * @returns {Promise<string>} The path to the created server directory
 */
export async function generateMcpServerTemplate(definition) {
  try {
    // Generate a server ID if one wasn't provided
    if (!definition.id) {
      definition.id = definition.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    
    // Create the server directory
    const serverDir = path.join(__dirname, '../../mcp-servers', definition.id);
    
    try {
      await fs.access(serverDir);
      logger.warn(`Directory already exists: ${serverDir}`);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(serverDir, { recursive: true });
    }
    
    // Create package.json
    const packageJson = {
      name: definition.id,
      version: definition.version || '0.1.0',
      description: definition.description || `MCP server for ${definition.name}`,
      main: 'src/index.js',
      type: 'module',
      scripts: {
        start: 'node src/index.js',
        dev: 'nodemon src/index.js'
      },
      dependencies: {
        express: '^4.18.2',
        dotenv: '^16.4.5',
        winston: '^3.11.0'
      },
      devDependencies: {
        nodemon: '^3.1.0'
      }
    };
    
    await fs.writeFile(
      path.join(serverDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Create .env file
    const envContent = `# Server configuration
PORT=3001
NODE_ENV=development

# Logging
LOG_LEVEL=info

# Meta MCP Server connection
META_MCP_SERVER_URL=http://localhost:3000
REGISTER_WITH_META_SERVER=true
`;
    
    await fs.writeFile(path.join(serverDir, '.env'), envContent);
    
    // Create src directory
    const srcDir = path.join(serverDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    
    // Create index.js
    const indexContent = `import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { registerWithMetaServer } from './utils/registration.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Routes
app.post('/api/process', (req, res) => {
  logger.info('Processing request:', req.body);
  
  // Process the request based on the tool's capabilities
  // This is where the actual implementation would go
  
  res.json({
    success: true,
    message: 'Request processed successfully',
    result: {
      // This would be the actual result
      processed: true,
      timestamp: new Date().toISOString()
    }
  });
});

// Simple health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'MCP Server is running',
    name: '${definition.name}',
    version: '${definition.version || '0.1.0'}'
  });
});

// Start the server
app.listen(port, () => {
  logger.info(\`MCP Server listening on port \${port}\`);
  
  // Register with the meta MCP server if enabled
  if (process.env.REGISTER_WITH_META_SERVER === 'true') {
    registerWithMetaServer();
  }
});
`;
    
    await fs.writeFile(path.join(srcDir, 'index.js'), indexContent);
    
    // Create utils directory
    const utilsDir = path.join(srcDir, 'utils');
    await fs.mkdir(utilsDir, { recursive: true });
    
    // Create logger.js
    const loggerContent = `import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
`;
    
    await fs.writeFile(path.join(utilsDir, 'logger.js'), loggerContent);
    
    // Create registration.js
    const registrationContent = `import { logger } from './logger.js';

/**
 * Registers this MCP server with the meta MCP server
 */
export async function registerWithMetaServer() {
  try {
    const metaServerUrl = process.env.META_MCP_SERVER_URL || 'http://localhost:3000';
    
    logger.info(\`Registering with meta MCP server at \${metaServerUrl}\`);
    
    // Tool definition to register
    const toolDefinition = {
      id: '${definition.id}',
      name: '${definition.name}',
      version: '${definition.version || '0.1.0'}',
      description: '${definition.description || `MCP server for ${definition.name}`}',
      type: 'mcp-server',
      apiEndpoint: \`http://localhost:\${process.env.PORT || 3001}/api/process\`,
      capabilities: ${JSON.stringify(definition.capabilities || {}, null, 2)},
      defaultParams: ${JSON.stringify(definition.defaultParams || {}, null, 2)},
      executionConfig: {
        type: 'http',
        method: 'POST',
        url: \`http://localhost:\${process.env.PORT || 3001}/api/process\`,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    };
    
    // Register with the meta server
    const response = await fetch(\`\${metaServerUrl}/api/tools/register\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(toolDefinition)
    });
    
    if (response.ok) {
      const result = await response.json();
      logger.info('Successfully registered with meta MCP server:', result);
    } else {
      logger.error('Failed to register with meta MCP server:', await response.text());
    }
  } catch (error) {
    logger.error('Error registering with meta MCP server:', error);
  }
}
`;
    
    await fs.writeFile(path.join(utilsDir, 'registration.js'), registrationContent);
    
    logger.info(`Generated MCP server template at: ${serverDir}`);
    
    return serverDir;
  } catch (error) {
    logger.error('Error generating MCP server template:', error);
    throw error;
  }
}