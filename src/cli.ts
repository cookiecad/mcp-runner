#!/usr/bin/env node

import { listTools, runServer, terminateServer } from './index.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const serverName = args[1];

  if (!command || !serverName) {
    console.log(`
Usage: mcp-runner <command> <server-name> [params]

Commands:
  list-tools <server-name>     List available tools for the specified server
  runserver <server-name>      Run the specified server with optional parameters

Examples:
  mcp-runner list-tools weather-server
  mcp-runner runserver weather-server '{"city": "London"}'
`);
    process.exit(1);
  }

  try {
    switch (command) {
      case 'list-tools':
        const tools = await listTools(serverName);
        console.log('\nAvailable tools:');
        tools.forEach(tool => {
          console.log(`\n${tool.name}`);
          if (tool.description) console.log(`Description: ${tool.description}`);
          if (tool.inputSchema) console.log('Input Schema:', JSON.stringify(tool.inputSchema, null, 2));
        });
        await terminateServer();
        break;

      case 'runserver':
        const params = args[2] ? JSON.parse(args[2]) : {};
        const result = await runServer(serverName, params);
        console.log('\nServer response:', JSON.stringify(result, null, 2));
        await terminateServer();
        break;

      default:
        console.error('Unknown command:', command);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch(console.error);