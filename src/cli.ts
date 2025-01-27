#!/usr/bin/env node

import { listTools, runServer, terminateServer } from './index.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const serverName = args[1];

  if (!command || !serverName) {
    console.log(`
Usage: mcp-runner <command> <server-name> [tool-name] [params] [options]

Commands:
  list-tools <server-name>                    List available tools for the specified server
  runserver <server-name> [tool-name] [params] Run a specific tool (or first available) with parameters

Options:
  --text     Output only the text content from the response

Examples:
  mcp-runner list-tools sequential-thinking
  mcp-runner runserver sequential-thinking sequentialthinking '{"thought": "Initial thought", "thoughtNumber": 1}'
  mcp-runner runserver sequential-thinking '{"thought": "Initial thought", "thoughtNumber": 1}' # uses first available tool
  mcp-runner runserver sequential-thinking sequentialthinking '{"thought": "Initial thought"}' --text # output only text
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
        let textOnly = false;
        let paramIndex = 2;

        // Parse arguments
        const remainingArgs = [...args.slice(2)]; // Copy args starting from index 2
        
        // Process each argument
        while (remainingArgs.length > 0) {
          const arg = remainingArgs.shift()!;
          
          if (arg === '--text') {
            textOnly = true;
            continue;
          }
          
          try {
            // Try to parse as JSON (params)
            params = JSON.parse(arg);
          } catch {
            // If not JSON and not a flag, treat as tool name
            if (!arg.startsWith('--')) {
              toolName = arg;
              // Check next argument for params
              const nextArg = remainingArgs[0];
              if (nextArg && !nextArg.startsWith('--')) {
                try {
                  params = JSON.parse(nextArg);
                  remainingArgs.shift(); // Remove the params argument
                } catch {
                  // If next arg isn't valid JSON, ignore it
                }
              }
            }
          }
        }

        const result = await runServer(serverName, toolName, params);
        
        if (textOnly && Array.isArray(result.content)) {
          // Extract and display only text content
          const textContent = result.content
            .filter((c: { type: string; text: string }) => c.type === 'text')
            .map((c: { type: string; text: string }) => c.text)
            .join('\n');
          console.log('\n' + textContent);
        } else {
          console.log('\nServer response:', JSON.stringify(result, null, 2));
        }
        
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