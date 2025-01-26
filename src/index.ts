import { ServerManager } from './ServerManager.js';

/**
 * Run an MCP server with the specified parameters
 * @param serverName - Name of the server to run from configuration
 * @param params - Parameters to pass to the server's tool
 * @returns Promise resolving with the server's response
 */
export async function runServer(serverName: string, params: Record<string, unknown>) {
  const serverManager = ServerManager.getInstance();

  try {
    const client = await serverManager.getClient(serverName);

    // List available tools
    const { tools } = await client.listTools({});
    if (!tools || tools.length === 0) {
      throw new Error('No tools available from server');
    }

    // Call first available tool with params
    const result = await client.callTool({
      name: tools[0].name,
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