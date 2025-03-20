/**
 * Example MCP tool definition for creating visualizations
 */

export default {
  id: 'visualization-creator',
  name: 'Visualization Creator',
  version: '0.1.0',
  description: 'A tool for creating various types of data visualizations',
  type: 'mcp-server',
  apiEndpoint: 'http://localhost:3002/api/visualize',
  capabilities: {
    intents: ['VISUALIZATION', 'DATA_PROCESSING'],
    fileTypes: ['csv', 'json'],
    dataTypes: ['tabular', 'json'],
    visualizationTypes: [
      'bar_chart',
      'line_chart',
      'pie_chart',
      'scatter_plot',
      'heatmap',
      'histogram'
    ]
  },
  defaultParams: {
    data: {},
    type: 'bar_chart',
    title: 'Visualization',
    width: 800,
    height: 600,
    colorScheme: 'default'
  },
  outputs: {
    success: true,
    visualizationPath: '',
    format: 'svg'
  },
  executionConfig: {
    type: 'http',
    method: 'POST',
    url: 'http://localhost:3002/api/visualize',
    headers: {
      'Content-Type': 'application/json'
    }
  }
};