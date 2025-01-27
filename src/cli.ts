#!/usr/bin/env node

import { listTools, runServer, terminateServer } from './index.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const serverName = args[1];

  if (!command || !serverName) {
    console.log(`
Usage: mcp-runner <command> <server-name> [tool-name] [params]

Commands:
  list-tools <server-name>                    List available tools for the specified server
  runserver <server-name> [tool-name] [params] Run a specific tool (or first available) with parameters

Examples:
  mcp-runner list-tools sequential-thinking
  mcp-runner runserver sequential-thinking sequentialthinking '{"thought": "Initial thought", "thoughtNumber": 1}'
  mcp-runner runserver sequential-thinking '{"thought": "Initial thought", "thoughtNumber": 1}' # uses first available tool
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
        let toolName: string | undefined;
        let params: Record<string, unknown> = {};

        // Check if third argument is a tool name or params
        if (args[2]) {
          try {
            // Try to parse as JSON (params)
            params = JSON.parse(args[2]);
          } catch {
            // If not JSON, treat as tool name
            toolName = args[2];
            // If there's a fourth argument, treat as params
            if (args[3]) {
              params = JSON.parse(args[3]);
            }
          }
        }

        const result = await runServer(serverName, toolName, params);
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