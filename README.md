# mcp-runner

A TypeScript SDK and CLI for running MCP (Model Context Protocol) servers.

## Overview

`mcp-runner` is designed to facilitate the execution of MCP servers based on configurations defined in `cline_mcp_settings.json`. It supports reusable server processes and controlled cleanup, allowing multiple operations to be performed using the same server instance.

You can call it from the command line or use it as a library in your own TypeScript projects or even from other MCP servers.

## Features

- Server process reuse across multiple calls
- Graceful termination with timeout handling
- Automatic server lifecycle management
- TypeScript support
- Error handling and logging

## Installation

```bash
npm install
```

## CLI Usage

The package includes a command-line interface for interacting with MCP servers.

### Commands

#### List Tools
Lists all available tools for a specified MCP server:
```bash
npm run cli list-tools <server-name>
```

Example:
```bash
npm run cli list-tools sequential-thinking
```

#### Run Server
Runs a specified MCP server with optional parameters:
```bash
npm run cli runserver <server-name> [params]
```

Example:
```bash
npm run cli runserver sequential-thinking '{"thought": "Initial thought", "thoughtNumber": 1, "totalThoughts": 5, "nextThoughtNeeded": true}'
```

## Programmatic Usage

### Basic Example

```typescript
import { runServer, terminateServer } from 'mcp-runner';

async function main() {
  try {
    // First call
    const result1 = await runServer('openrouterai', { 
      messages: [
        { role: 'user', content: 'Say hello!' }
      ] 
    });
    console.log('Result 1:', result1);

    // Second call (reuses same server process)
    const result2 = await runServer('openrouterai', { 
      messages: [
        { role: 'user', content: 'How are you?' }
      ] 
    });
    console.log('Result 2:', result2);

    // Terminate server when done
    await terminateServer();
  } catch (error) {
    console.error('Error:', error);
    await terminateServer();
  }
}
```

### Error Handling

The SDK includes comprehensive error handling:
- Server process errors
- Tool execution errors
- Timeout handling for graceful termination
- Automatic cleanup on errors

## API

### runServer(serverName: string, params: Record<string, unknown>)

Runs a tool on the specified server using provided parameters. The server process is reused for subsequent calls until explicitly terminated.

Parameters:
- `serverName`: Name of the server from configuration
- `params`: Parameters to pass to the server's tool

Returns: Promise resolving with the server's response

### terminateServer()

Terminates the server process managed by the SDK. Should be called when all operations are complete.

Returns: Promise that resolves when the server is terminated

## Architecture

### ServerManager

The `ServerManager` class is implemented as a singleton that manages the lifecycle of MCP server processes. Key responsibilities include:

- Process lifecycle management
- Client connection handling
- Graceful termination
- Error handling and logging

The manager ensures that only one server process is running at any given time and provides methods to start, reuse, and terminate the server.

### Configuration

The SDK reads server configurations from `cline_mcp_settings.json`, which should be located in the standard configuration directory. Each server configuration includes:

```json
{
  "command": "string",
  "args": "string[]",
  "env": "Record<string, string>",
  "disabled": "boolean",
  "alwaysAllow": "string[]"
}
```

## Development

### Building

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.