# Meta MCP Server

A meta server for orchestrating and leveraging multiple MCP servers and tools based on user requests.

## Overview

This project serves as an orchestration layer between users and various Model Control Protocol (MCP) servers and tools. It analyzes user requests, determines the appropriate tools needed, and coordinates their execution to fulfill the request.

## Key Features

- **Request Analysis**: Parses and understands user requests to determine intent
- **Tool Discovery**: Maintains a registry of available MCP tools and their capabilities
- **Orchestration**: Creates execution plans that may involve multiple MCP servers
- **Tool Recommendation**: Suggests creation of new tools when gaps are identified

## Getting Started

### Prerequisites

- Node.js v18 or higher
- Access to one or more MCP servers/tools

### Installation

```bash
# Clone the repository
git clone https://github.com/infinitimeless/meta-mcp-server.git
cd meta-mcp-server

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Start the server
npm start
```

## Usage

The server exposes a REST API that accepts user requests and routes them to the appropriate MCP tools.

```bash
# Example request using curl
curl -X POST http://localhost:3000/api/request \
  -H "Content-Type: application/json" \
  -d '{"query": "Extract data from sales.csv and create a bar chart visualization"}'
```

## Architecture

The system consists of the following components:

1. **Request Analyzer**: Parses user input to determine intent and required capabilities
2. **MCP Registry**: Maintains a catalog of all available MCP servers and tools
3. **Orchestration Engine**: Creates and executes workflows involving multiple tools
4. **Tool Recommender**: Suggests new tools when gaps are identified

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.