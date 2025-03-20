import { logger } from '../utils/logger.js';
import { registry } from '../registry/index.js';

/**
 * Executes a plan by running each step in sequence and handling data flow.
 * 
 * @param {Object} plan The execution plan created by the orchestrator
 * @returns {Object} The execution results
 */
export async function executeRequest(plan) {
  logger.info(`Executing plan ${plan.planId} with ${plan.steps.length} steps`);
  
  // Check if plan can be executed
  if (!plan.canExecute) {
    return {
      success: false,
      reason: plan.reason || 'Plan cannot be executed',
      suggestedTools: plan.suggestedTools
    };
  }
  
  // Store results of each step
  const stepResults = {};
  
  // Track overall success
  let overallSuccess = true;
  let errorMessage = null;
  
  // Execute each step in sequence
  for (const step of plan.steps) {
    try {
      logger.info(`Executing step ${step.stepId} with tool ${step.toolId}`);
      
      // Get the tool instance
      const toolInstance = await getToolInstance(step.toolId);
      
      if (!toolInstance) {
        logger.error(`Tool ${step.toolId} not found`);
        stepResults[step.stepId] = {
          success: false,
          error: `Tool ${step.toolId} not found`
        };
        overallSuccess = false;
        errorMessage = `Tool ${step.toolId} not found`;
        break;
      }
      
      // Transform input parameters if needed based on data flow
      const inputParams = await transformInputParams(step, stepResults, plan.dataFlow);
      
      // Execute the tool
      const result = await executeTool(toolInstance, inputParams);
      
      // Store the result
      stepResults[step.stepId] = {
        success: true,
        result
      };
      
      logger.info(`Step ${step.stepId} completed successfully`);
    } catch (error) {
      logger.error(`Error executing step ${step.stepId}:`, error);
      
      stepResults[step.stepId] = {
        success: false,
        error: error.message
      };
      
      overallSuccess = false;
      errorMessage = `Error in step ${step.stepId}: ${error.message}`;
      break;
    }
  }
  
  return {
    planId: plan.planId,
    success: overallSuccess,
    stepResults,
    error: errorMessage,
    timestamp: new Date().toISOString()
  };
}

/**
 * Gets a tool instance by ID
 */
async function getToolInstance(toolId) {
  const tools = registry.getTools();
  return tools.find(tool => tool.id === toolId);
}

/**
 * Transforms input parameters based on data flow from previous steps
 */
async function transformInputParams(step, stepResults, dataFlow) {
  // Start with the step's defined input parameters
  const inputParams = { ...step.inputParams };
  
  // Look for data flow connections to this step
  const connections = Object.values(dataFlow).filter(flow => flow.to === step.stepId);
  
  for (const connection of connections) {
    const sourceStepId = connection.from;
    const sourceStepResult = stepResults[sourceStepId];
    
    // Skip if the source step didn't complete successfully
    if (!sourceStepResult || !sourceStepResult.success) {
      continue;
    }
    
    // Apply the mappings
    for (const mapping of connection.mappings) {
      const sourceValue = sourceStepResult.result[mapping.fromParam];
      
      if (sourceValue !== undefined) {
        inputParams[mapping.toParam] = sourceValue;
      }
    }
  }
  
  return inputParams;
}

/**
 * Executes a tool with the given parameters
 */
async function executeTool(tool, params) {
  // In a real implementation, this would use the tool's execution mechanism
  // For now, we'll simulate execution
  
  // Check if the tool has an execute method (for JS-based tools)
  if (tool.execute && typeof tool.execute === 'function') {
    return await tool.execute(params);
  }
  
  // Check if the tool has an executionConfig (for declarative tools)
  if (tool.executionConfig) {
    return await executeDeclarativeTool(tool, params);
  }
  
  // For MCP servers, we would make an HTTP request
  if (tool.type === 'mcp-server') {
    return await executeMcpServer(tool, params);
  }
  
  throw new Error(`Tool ${tool.id} doesn't have a valid execution mechanism`);
}

/**
 * Executes a declarative tool (defined by configuration)
 */
async function executeDeclarativeTool(tool, params) {
  const { executionConfig } = tool;
  
  // Check execution type
  switch (executionConfig.type) {
    case 'http':
      return await executeHttpTool(executionConfig, params);
      
    case 'command-line':
      return await executeCommandLineTool(executionConfig, params);
      
    default:
      throw new Error(`Unknown execution type: ${executionConfig.type}`);
  }
}

/**
 * Executes a tool via HTTP
 */
async function executeHttpTool(config, params) {
  // In a real implementation, this would make an actual HTTP request
  logger.info(`Executing HTTP tool with URL: ${config.url}`);
  
  // Placeholder for HTTP execution
  return {
    status: 'success',
    message: 'HTTP tool executed successfully',
    params
  };
}

/**
 * Executes a tool via command line
 */
async function executeCommandLineTool(config, params) {
  // In a real implementation, this would execute a command
  logger.info(`Executing command-line tool with command: ${config.command}`);
  
  // Placeholder for command line execution
  return {
    status: 'success',
    message: 'Command-line tool executed successfully',
    params
  };
}

/**
 * Executes an MCP server with the given parameters
 */
async function executeMcpServer(tool, params) {
  // In a real implementation, this would connect to the MCP server
  logger.info(`Executing MCP server: ${tool.id}`);
  
  // Check if the tool specifies an API endpoint
  if (!tool.apiEndpoint) {
    throw new Error(`MCP server ${tool.id} doesn't have an API endpoint`);
  }
  
  try {
    // Placeholder for MCP server execution
    // In a real implementation, this would make a request to the MCP server
    
    logger.info(`Calling MCP server at ${tool.apiEndpoint}`);
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Return a simulated result
    return {
      status: 'success',
      message: 'MCP server executed successfully',
      result: {
        // We could include the simulated output of the MCP server here
        data: {},
        metadata: {
          processingTime: '50ms',
          server: tool.id
        }
      }
    };
  } catch (error) {
    logger.error(`Error executing MCP server ${tool.id}:`, error);
    throw new Error(`Failed to execute MCP server ${tool.id}: ${error.message}`);
  }
}

/**
 * Creates a new MCP server instance
 */
export async function createMcpServer(definition) {
  logger.info(`Creating new MCP server: ${definition.name}`);
  
  // In a real implementation, this would create a new MCP server
  // For now, we'll just register the definition in the registry
  
  // Generate an ID if one wasn't provided
  if (!definition.id) {
    definition.id = `mcp-server-${Date.now()}`;
  }
  
  // Set the tool type to MCP server
  definition.type = 'mcp-server';
  
  // Register the new tool
  await registry.registerTool(definition);
  
  return {
    success: true,
    serverId: definition.id,
    message: `MCP server ${definition.name} created successfully`
  };
}

/**
 * Stops an MCP server
 */
export async function stopMcpServer(serverId) {
  logger.info(`Stopping MCP server: ${serverId}`);
  
  // In a real implementation, this would stop the MCP server
  // For now, we'll just simulate success
  
  return {
    success: true,
    message: `MCP server ${serverId} stopped successfully`
  };
}