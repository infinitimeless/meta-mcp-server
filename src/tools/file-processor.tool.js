/**
 * Example MCP tool definition for processing files
 */

export default {
  id: 'file-processor',
  name: 'File Processor',
  version: '0.1.0',
  description: 'A tool for reading and processing various file types',
  type: 'mcp-server',
  apiEndpoint: 'http://localhost:3001/api/process',
  capabilities: {
    intents: ['FILE_OPERATION', 'DATA_PROCESSING'],
    fileTypes: ['csv', 'json', 'txt'],
    dataTypes: ['tabular', 'json', 'text']
  },
  defaultParams: {
    filePath: '',
    outputFormat: 'json'
  },
  outputs: {
    success: true,
    result: {},
    processingTime: '0ms'
  },
  executionConfig: {
    type: 'http',
    method: 'POST',
    url: 'http://localhost:3001/api/process',
    headers: {
      'Content-Type': 'application/json'
    }
  }
};