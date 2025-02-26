import { ServerManager } from './ServerManager.js';

/**
 * List all available tools for a specified server
 * @param serverName - Name of the server to query
 * @returns Promise resolving with array of available tools
 */
export async function listTools(serverName: string) {
  const serverManager = ServerManager.getInstance();

  try {
    const client = await serverManager.getClient(serverName);
    const { tools } = await client.listTools({});
    return tools || [];
  } catch (error) {
    console.error('Error listing tools:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Run an MCP server with the specified parameters
 * @param serverName - Name of the server to run from configuration
 * @param toolName - Name of the tool to run (optional, uses first available tool if not specified)
 * @param params - Parameters to pass to the server's tool
 * @returns Promise resolving with the server's response
 */
export async function runServer(serverName: string, toolName?: string, params: Record<string, unknown> = {}) {
  const serverManager = ServerManager.getInstance();

  try {
    const client = await serverManager.getClient(serverName);

    // List available tools
    const { tools } = await client.listTools({});
    if (!tools || tools.length === 0) {
      throw new Error('No tools available from server');
    }

    // Determine which tool to use
    const selectedTool = toolName
      ? tools.find(t => t.name === toolName)
      : tools[0];

    if (!selectedTool) {
      const availableTools = tools.map(t => t.name).join(', ');
      throw new Error(
        toolName
          ? `Tool "${toolName}" not found. Available tools: ${availableTools}`
          : 'No tools available from server'
      );
    }

    // Call the selected tool with params
    const result = await client.callTool({
      name: selectedTool.name,
      arguments: params
    });

    return result;
  } catch (error) {
    console.error('Error in runServer:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Terminate the currently running server process
 * @returns Promise that resolves when the server is terminated
 */
export async function terminateServer(): Promise<void> {
  const serverManager = ServerManager.getInstance();
  await serverManager.terminateServer();
}