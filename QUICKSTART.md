# Meta MCP Server Quick Start Guide

This guide will help you quickly get up and running with the Meta MCP Server.

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/infinitimeless/meta-mcp-server.git
   cd meta-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   ```

## Running the Server

Start the server in development mode:
```bash
npm run dev
```

Or in production mode:
```bash
npm start
```

The server should now be running at http://localhost:3000 (or whatever port you specified in your .env file).

## Testing the API

You can test the Meta MCP Server using curl:

```bash
# Check if the server is running
curl http://localhost:3000

# Get a list of available tools
curl http://localhost:3000/api/tools

# Send a request to process a query
curl -X POST http://localhost:3000/api/request \
  -H "Content-Type: application/json" \
  -d '{"query": "Extract data from sales.csv and create a bar chart"}'
```

## Creating a New MCP Tool

You can create a new MCP tool definition in two ways:

1. Manually create a file in the `src/tools` directory with a `.tool.js` or `.tool.json` extension.
2. Use the API to register a new tool:

```bash
curl -X POST http://localhost:3000/api/tools/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Tool",
    "description": "Description of my tool",
    "capabilities": {
      "intents": ["FILE_OPERATION", "DATA_PROCESSING"],
      "fileTypes": ["csv", "json"],
      "dataTypes": ["tabular", "json"]
    },
    "type": "mcp-server",
    "apiEndpoint": "http://localhost:3001/api/process"
  }'
```

## Understanding Project Structure

- `src/index.js`: Main entry point
- `src/routes/`: API routes
- `src/analyzer/`: Request analysis component
- `src/orchestrator/`: Execution plan creation
- `src/executor/`: Plan execution
- `src/registry/`: Tool management and discovery
- `src/tools/`: Tool definitions
- `src/utils/`: Utility functions and helpers

## Next Steps

Explore the codebase to understand how the Meta MCP Server works. The project is modular by design, making it easy to extend with new capabilities.

If you find any issues or want to contribute, feel free to open an issue or submit a pull request on GitHub.