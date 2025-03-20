import { registry } from '../registry/index.js';
import { logger } from '../utils/logger.js';

// Intent definitions
export const INTENT_TYPES = {
  FILE_OPERATION: 'FILE_OPERATION',
  DATA_PROCESSING: 'DATA_PROCESSING',
  CODE_GENERATION: 'CODE_GENERATION',
  VISUALIZATION: 'VISUALIZATION',
  KNOWLEDGE_RETRIEVAL: 'KNOWLEDGE_RETRIEVAL',
  TERMINAL_EXECUTION: 'TERMINAL_EXECUTION',
  WEB_SEARCH: 'WEB_SEARCH',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Analyzes a user request to determine intent and requirements.
 * This is where LangChain integration would happen for more sophisticated parsing.
 * 
 * @param {string} query The user's request text
 * @returns {Object} Analysis result with intent, entities, and requirements
 */
export async function analyzeRequest(query) {
  logger.info(`Analyzing request: ${query}`);
  
  // For now, we'll use a simple rule-based approach
  // In a real implementation, this would use LangChain or a similar NLP approach
  
  const lowerQuery = query.toLowerCase();
  
  // Detect intents based on keywords
  const intents = [];
  
  if (lowerQuery.includes('file') || lowerQuery.includes('read') || lowerQuery.includes('write') || 
      lowerQuery.includes('save') || lowerQuery.includes('load') || lowerQuery.includes('csv') ||
      lowerQuery.includes('json') || lowerQuery.includes('txt')) {
    intents.push(INTENT_TYPES.FILE_OPERATION);
  }
  
  if (lowerQuery.includes('process') || lowerQuery.includes('transform') || 
      lowerQuery.includes('extract') || lowerQuery.includes('convert') || 
      lowerQuery.includes('analyze') || lowerQuery.includes('calculate')) {
    intents.push(INTENT_TYPES.DATA_PROCESSING);
  }
  
  if (lowerQuery.includes('code') || lowerQuery.includes('program') || 
      lowerQuery.includes('function') || lowerQuery.includes('script') || 
      lowerQuery.includes('algorithm') || lowerQuery.includes('develop')) {
    intents.push(INTENT_TYPES.CODE_GENERATION);
  }
  
  if (lowerQuery.includes('visualize') || lowerQuery.includes('chart') || 
      lowerQuery.includes('plot') || lowerQuery.includes('graph') || 
      lowerQuery.includes('dashboard') || lowerQuery.includes('display')) {
    intents.push(INTENT_TYPES.VISUALIZATION);
  }
  
  if (lowerQuery.includes('search') || lowerQuery.includes('find') || 
      lowerQuery.includes('lookup') || lowerQuery.includes('retrieve') || 
      lowerQuery.includes('get information')) {
    intents.push(INTENT_TYPES.KNOWLEDGE_RETRIEVAL);
  }
  
  if (lowerQuery.includes('run') || lowerQuery.includes('execute') || 
      lowerQuery.includes('terminal') || lowerQuery.includes('command') || 
      lowerQuery.includes('shell') || lowerQuery.includes('bash')) {
    intents.push(INTENT_TYPES.TERMINAL_EXECUTION);
  }
  
  if (lowerQuery.includes('web') || lowerQuery.includes('internet') || 
      lowerQuery.includes('online') || lowerQuery.includes('website') || 
      lowerQuery.includes('url') || lowerQuery.includes('http')) {
    intents.push(INTENT_TYPES.WEB_SEARCH);
  }
  
  // If no intents were detected, mark as unknown
  if (intents.length === 0) {
    intents.push(INTENT_TYPES.UNKNOWN);
  }
  
  // Extract potential entities (files, data types, etc.)
  // In a real implementation, this would be more sophisticated
  const entities = {
    files: extractFileReferences(query),
    dataTypes: extractDataTypes(query),
    codeLanguages: extractCodeLanguages(query),
    visualizationTypes: extractVisualizationTypes(query),
  };
  
  // Match tools that might be suitable
  const matchedTools = await matchToolsToIntents(intents, entities);
  
  return {
    query,
    intents,
    entities,
    matchedTools,
    confidence: calculateConfidence(intents, entities),
    timestamp: new Date().toISOString()
  };
}

/**
 * Extracts file references from the query
 */
function extractFileReferences(query) {
  // Simple regex to find potential file references
  // In a real implementation, this would be more sophisticated
  const filePattern = /\b([\w-]+\.(csv|json|txt|md|py|js|html|css|xml|pdf))\b/g;
  const matches = [...query.matchAll(filePattern)];
  return matches.map(match => match[0]);
}

/**
 * Extracts data types from the query
 */
function extractDataTypes(query) {
  const lowerQuery = query.toLowerCase();
  const dataTypes = [];
  
  if (lowerQuery.includes('csv') || lowerQuery.includes('spreadsheet') || 
      lowerQuery.includes('excel') || lowerQuery.includes('table')) {
    dataTypes.push('tabular');
  }
  
  if (lowerQuery.includes('json') || lowerQuery.includes('object') || 
      lowerQuery.includes('dictionary')) {
    dataTypes.push('json');
  }
  
  if (lowerQuery.includes('text') || lowerQuery.includes('string') || 
      lowerQuery.includes('document')) {
    dataTypes.push('text');
  }
  
  if (lowerQuery.includes('image') || lowerQuery.includes('picture') || 
      lowerQuery.includes('photo') || lowerQuery.includes('graphic')) {
    dataTypes.push('image');
  }
  
  return dataTypes;
}

/**
 * Extracts programming languages from the query
 */
function extractCodeLanguages(query) {
  const lowerQuery = query.toLowerCase();
  const languages = [];
  
  // Check for common programming languages
  const languagePatterns = [
    { pattern: /\b(python|py)\b/i, language: 'python' },
    { pattern: /\b(javascript|js|node)\b/i, language: 'javascript' },
    { pattern: /\b(typescript|ts)\b/i, language: 'typescript' },
    { pattern: /\b(java)\b/i, language: 'java' },
    { pattern: /\b(c\+\+|cpp)\b/i, language: 'cpp' },
    { pattern: /\b(c#|csharp)\b/i, language: 'csharp' },
    { pattern: /\b(ruby|rb)\b/i, language: 'ruby' },
    { pattern: /\b(go|golang)\b/i, language: 'go' },
    { pattern: /\b(php)\b/i, language: 'php' },
    { pattern: /\b(sql)\b/i, language: 'sql' },
    { pattern: /\b(bash|shell)\b/i, language: 'bash' },
    { pattern: /\b(rust)\b/i, language: 'rust' },
    { pattern: /\b(html)\b/i, language: 'html' },
    { pattern: /\b(css)\b/i, language: 'css' }
  ];
  
  for (const { pattern, language } of languagePatterns) {
    if (pattern.test(lowerQuery)) {
      languages.push(language);
    }
  }
  
  return languages;
}

/**
 * Extracts visualization types from the query
 */
function extractVisualizationTypes(query) {
  const lowerQuery = query.toLowerCase();
  const types = [];
  
  if (lowerQuery.includes('bar') || lowerQuery.includes('column')) {
    types.push('bar_chart');
  }
  
  if (lowerQuery.includes('line') || lowerQuery.includes('trend')) {
    types.push('line_chart');
  }
  
  if (lowerQuery.includes('pie') || lowerQuery.includes('donut')) {
    types.push('pie_chart');
  }
  
  if (lowerQuery.includes('scatter') || lowerQuery.includes('point')) {
    types.push('scatter_plot');
  }
  
  if (lowerQuery.includes('heatmap') || lowerQuery.includes('heat map')) {
    types.push('heatmap');
  }
  
  if (lowerQuery.includes('histogram')) {
    types.push('histogram');
  }
  
  if (lowerQuery.includes('box plot') || lowerQuery.includes('boxplot')) {
    types.push('box_plot');
  }
  
  return types;
}

/**
 * Matches suitable tools based on detected intents and entities
 */
async function matchToolsToIntents(intents, entities) {
  const allTools = registry.getTools();
  const matchedTools = [];
  
  for (const tool of allTools) {
    // Check if the tool supports any of the detected intents
    const intentMatch = intents.some(intent => 
      tool.capabilities && tool.capabilities.intents && 
      tool.capabilities.intents.includes(intent)
    );
    
    if (intentMatch) {
      // Calculate match score based on entity compatibility
      const score = calculateToolMatchScore(tool, entities);
      
      if (score > 0) {
        matchedTools.push({
          tool,
          score
        });
      }
    }
  }
  
  // Sort tools by match score (descending)
  return matchedTools.sort((a, b) => b.score - a.score);
}

/**
 * Calculates a match score for a tool based on entity compatibility
 */
function calculateToolMatchScore(tool, entities) {
  let score = 0;
  
  // Check file type compatibility
  if (tool.capabilities && tool.capabilities.fileTypes) {
    const fileMatches = entities.files.filter(file => {
      const extension = file.split('.').pop().toLowerCase();
      return tool.capabilities.fileTypes.includes(extension);
    });
    
    score += fileMatches.length * 10;
  }
  
  // Check data type compatibility
  if (tool.capabilities && tool.capabilities.dataTypes) {
    const dataTypeMatches = entities.dataTypes.filter(type => 
      tool.capabilities.dataTypes.includes(type)
    );
    
    score += dataTypeMatches.length * 5;
  }
  
  // Check language compatibility
  if (tool.capabilities && tool.capabilities.languages) {
    const languageMatches = entities.codeLanguages.filter(lang => 
      tool.capabilities.languages.includes(lang)
    );
    
    score += languageMatches.length * 8;
  }
  
  // Check visualization compatibility
  if (tool.capabilities && tool.capabilities.visualizationTypes) {
    const visMatches = entities.visualizationTypes.filter(type => 
      tool.capabilities.visualizationTypes.includes(type)
    );
    
    score += visMatches.length * 7;
  }
  
  return score;
}

/**
 * Calculates overall confidence in the analysis
 */
function calculateConfidence(intents, entities) {
  // Simple confidence calculation
  // In a real implementation, this would be more sophisticated
  
  let confidence = 0;
  
  // If we identified specific intents, that increases confidence
  if (!intents.includes(INTENT_TYPES.UNKNOWN)) {
    confidence += 0.4;
  }
  
  // If we extracted specific entities, that also increases confidence
  if (entities.files.length > 0) confidence += 0.15;
  if (entities.dataTypes.length > 0) confidence += 0.15;
  if (entities.codeLanguages.length > 0) confidence += 0.15;
  if (entities.visualizationTypes.length > 0) confidence += 0.15;
  
  return Math.min(confidence, 1.0);
}