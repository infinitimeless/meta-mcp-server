import { logger } from '../utils/logger.js';
import { INTENT_TYPES } from '../analyzer/index.js';

/**
 * Creates an execution plan based on the request analysis.
 * 
 * @param {Object} analysis The analysis result from the analyzer
 * @returns {Object} An execution plan with steps and tools to use
 */
export async function createExecutionPlan(analysis) {
  logger.info(`Creating execution plan for query: ${analysis.query}`);
  
  const { intents, entities, matchedTools } = analysis;
  
  // If no tools were matched, we can't create a plan
  if (matchedTools.length === 0) {
    return {
      canExecute: false,
      reason: 'No suitable tools found',
      suggestedTools: suggestToolsToCreate(intents, entities)
    };
  }
  
  // Create a plan with sequential steps
  const steps = [];
  
  // Track which intents have been addressed by the plan
  const addressedIntents = new Set();
  
  // First, try to address each intent with the best-matching tool
  for (const intent of intents) {
    if (intent === INTENT_TYPES.UNKNOWN) continue;
    
    // Find the best tool for this intent
    const toolForIntent = findBestToolForIntent(intent, matchedTools);
    
    if (toolForIntent) {
      steps.push({
        stepId: `step_${steps.length + 1}`,
        intent,
        toolId: toolForIntent.tool.id,
        toolName: toolForIntent.tool.name,
        inputParams: determineInputParams(intent, entities, toolForIntent.tool),
        outputParams: determineOutputParams(intent, toolForIntent.tool)
      });
      
      addressedIntents.add(intent);
    }
  }
  
  // Check if all intents have been addressed
  const unaddressedIntents = intents.filter(intent => 
    intent !== INTENT_TYPES.UNKNOWN && !addressedIntents.has(intent)
  );
  
  // Create a sequential execution plan
  const plan = {
    planId: generatePlanId(),
    canExecute: steps.length > 0,
    steps,
    dataFlow: createDataFlowMap(steps),
    timestamp: new Date().toISOString(),
    unaddressedIntents: unaddressedIntents.length > 0 ? unaddressedIntents : undefined
  };
  
  // If there are unaddressed intents, suggest tools to create
  if (unaddressedIntents.length > 0) {
    plan.suggestedTools = suggestToolsToCreate(unaddressedIntents, entities);
  }
  
  return plan;
}

/**
 * Finds the best tool for a specific intent from the matched tools
 */
function findBestToolForIntent(intent, matchedTools) {
  // Filter tools that support this intent
  const toolsForIntent = matchedTools.filter(tool => 
    tool.tool.capabilities && 
    tool.tool.capabilities.intents && 
    tool.tool.capabilities.intents.includes(intent)
  );
  
  // Sort by match score (descending)
  toolsForIntent.sort((a, b) => b.score - a.score);
  
  return toolsForIntent.length > 0 ? toolsForIntent[0] : null;
}

/**
 * Determines what input parameters to pass to a tool based on intent and entities
 */
function determineInputParams(intent, entities, tool) {
  // This would be more sophisticated in a real implementation
  // based on the specific tool's requirements
  
  const params = {};
  
  switch (intent) {
    case INTENT_TYPES.FILE_OPERATION:
      if (entities.files.length > 0) {
        params.filePath = entities.files[0];
      }
      break;
      
    case INTENT_TYPES.DATA_PROCESSING:
      if (entities.files.length > 0) {
        params.inputFile = entities.files[0];
      }
      if (entities.dataTypes.length > 0) {
        params.dataType = entities.dataTypes[0];
      }
      break;
      
    case INTENT_TYPES.CODE_GENERATION:
      if (entities.codeLanguages.length > 0) {
        params.language = entities.codeLanguages[0];
      }
      break;
      
    case INTENT_TYPES.VISUALIZATION:
      if (entities.files.length > 0) {
        params.dataSource = entities.files[0];
      }
      if (entities.visualizationTypes.length > 0) {
        params.visualizationType = entities.visualizationTypes[0];
      }
      break;
      
    case INTENT_TYPES.KNOWLEDGE_RETRIEVAL:
      // No specific parameters needed
      break;
      
    case INTENT_TYPES.TERMINAL_EXECUTION:
      // No specific parameters needed
      break;
      
    case INTENT_TYPES.WEB_SEARCH:
      // No specific parameters needed
      break;
  }
  
  // Merge with tool-specific default parameters
  if (tool.defaultParams) {
    return { ...tool.defaultParams, ...params };
  }
  
  return params;
}

/**
 * Determines what output parameters to expect from a tool
 */
function determineOutputParams(intent, tool) {
  // This would be more sophisticated in a real implementation
  // based on the specific tool's outputs
  
  // For now, use the tool's declared outputs if available
  if (tool.outputs) {
    return tool.outputs;
  }
  
  // Otherwise, provide generic outputs based on intent
  switch (intent) {
    case INTENT_TYPES.FILE_OPERATION:
      return { success: true, filePath: '' };
      
    case INTENT_TYPES.DATA_PROCESSING:
      return { success: true, result: {} };
      
    case INTENT_TYPES.CODE_GENERATION:
      return { success: true, code: '' };
      
    case INTENT_TYPES.VISUALIZATION:
      return { success: true, visualizationPath: '' };
      
    case INTENT_TYPES.KNOWLEDGE_RETRIEVAL:
      return { success: true, knowledge: {} };
      
    case INTENT_TYPES.TERMINAL_EXECUTION:
      return { success: true, output: '' };
      
    case INTENT_TYPES.WEB_SEARCH:
      return { success: true, results: [] };
      
    default:
      return { success: true };
  }
}

/**
 * Creates a data flow map between steps
 */
function createDataFlowMap(steps) {
  const dataFlow = {};
  
  // In a simple sequential flow, each step's output becomes the next step's input
  for (let i = 0; i < steps.length - 1; i++) {
    const currentStep = steps[i];
    const nextStep = steps[i + 1];
    
    dataFlow[`${currentStep.stepId}:${nextStep.stepId}`] = {
      from: currentStep.stepId,
      to: nextStep.stepId,
      mappings: [
        {
          fromParam: 'result',
          toParam: 'input'
        }
      ]
    };
  }
  
  return dataFlow;
}

/**
 * Generates a unique plan ID
 */
function generatePlanId() {
  return `plan_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/**
 * Suggests tools to create for unaddressed intents
 */
function suggestToolsToCreate(intents, entities) {
  const suggestions = [];
  
  // If intents is an array (from the unaddressed intents)
  const intentsArray = Array.isArray(intents) ? intents : [intents];
  
  for (const intent of intentsArray) {
    if (intent === INTENT_TYPES.UNKNOWN) continue;
    
    let description = `A tool that can handle ${intent.toLowerCase().replace('_', ' ')}`;
    
    // Add more specific details based on entities
    if (intent === INTENT_TYPES.FILE_OPERATION && entities.files.length > 0) {
      const extensions = [...new Set(entities.files.map(file => file.split('.').pop()))];
      description += ` for ${extensions.join(', ')} files`;
    }
    
    if (intent === INTENT_TYPES.DATA_PROCESSING && entities.dataTypes.length > 0) {
      description += ` with ${entities.dataTypes.join(', ')} data`;
    }
    
    if (intent === INTENT_TYPES.CODE_GENERATION && entities.codeLanguages.length > 0) {
      description += ` in ${entities.codeLanguages.join(', ')}`;
    }
    
    if (intent === INTENT_TYPES.VISUALIZATION && entities.visualizationTypes.length > 0) {
      description += ` for ${entities.visualizationTypes.join(', ')} visualizations`;
    }
    
    suggestions.push({
      intent,
      description,
      template: generateToolTemplate(intent, entities)
    });
  }
  
  return suggestions;
}

/**
 * Generates a template for a tool based on intent and entities
 */
function generateToolTemplate(intent, entities) {
  // Base template for any tool
  const template = {
    id: `${intent.toLowerCase()}_tool`,
    name: `${intent.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')} Tool`,
    version: '0.1.0',
    description: `A tool for ${intent.toLowerCase().replace('_', ' ')}`,
    capabilities: {
      intents: [intent]
    },
    defaultParams: {},
    outputs: {}
  };
  
  // Customize based on intent
  switch (intent) {
    case INTENT_TYPES.FILE_OPERATION:
      template.capabilities.fileTypes = entities.files.map(file => file.split('.').pop());
      template.defaultParams = { filePath: '' };
      template.outputs = { success: true, filePath: '' };
      break;
      
    case INTENT_TYPES.DATA_PROCESSING:
      template.capabilities.dataTypes = entities.dataTypes;
      template.defaultParams = { inputData: {} };
      template.outputs = { success: true, result: {} };
      break;
      
    case INTENT_TYPES.CODE_GENERATION:
      template.capabilities.languages = entities.codeLanguages;
      template.defaultParams = { prompt: '' };
      template.outputs = { success: true, code: '' };
      break;
      
    case INTENT_TYPES.VISUALIZATION:
      template.capabilities.visualizationTypes = entities.visualizationTypes;
      template.defaultParams = { data: {} };
      template.outputs = { success: true, visualizationPath: '' };
      break;
      
    case INTENT_TYPES.KNOWLEDGE_RETRIEVAL:
      template.defaultParams = { query: '' };
      template.outputs = { success: true, knowledge: {} };
      break;
      
    case INTENT_TYPES.TERMINAL_EXECUTION:
      template.defaultParams = { command: '' };
      template.outputs = { success: true, output: '' };
      break;
      
    case INTENT_TYPES.WEB_SEARCH:
      template.defaultParams = { query: '' };
      template.outputs = { success: true, results: [] };
      break;
  }
  
  return template;
}