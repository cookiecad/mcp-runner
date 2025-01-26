import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn, ChildProcess } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';
import { readFileSync } from 'fs';

interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  alwaysAllow?: string[];
}

interface McpSettings {
  mcpServers: Record<string, McpServerConfig>;
}

export class ServerManager {
  private static instance: ServerManager;
  private serverProcess: ChildProcess | null = null;
  private client: Client | null = null;
  private config: McpSettings;

  private constructor() {
    const configPath = join(homedir(), '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json');
    this.config = JSON.parse(readFileSync(configPath, 'utf-8'));
  }

  public static getInstance(): ServerManager {
    if (!ServerManager.instance) {
      ServerManager.instance = new ServerManager();
    }
    return ServerManager.instance;
  }

  public async getClient(serverName: string): Promise<Client> {
    if (this.client && !this.isProcessTerminated()) {
      return this.client;
    }

    // Start the server process
    const serverConfig = this.config.mcpServers[serverName];
    if (!serverConfig || serverConfig.disabled) {
      throw new Error(`Server "${serverName}" not found or is disabled`);
    }

    this.serverProcess = spawn(serverConfig.command, serverConfig.args || [], {
      env: { ...process.env, ...serverConfig.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle server process errors and termination
    this.serverProcess.on('error', (err) => {
      console.error('Server process error:', err);
      this.terminateServer();
    });

    this.serverProcess.on('exit', (code) => {
      if (code !== null && code !== 0) {
        console.error(`Server process exited with code ${code}`);
      }
      this.client = null;
      this.serverProcess = null;
    });

    // Create transport with server configuration
    const transport = new StdioClientTransport({
      command: serverConfig.command,
      args: serverConfig.args || [],
      env: Object.fromEntries(
        Object.entries({ ...process.env, ...serverConfig.env })
          .filter((entry): entry is [string, string] => entry[1] !== undefined)
      )
    });

    // Create client with transport
    this.client = new Client({
      name: 'mcp-runner',
      version: '1.0.0'
    });

    // Connect client with transport
    await this.client.connect(transport);

    return this.client;
  }

  public async terminateServer(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }

    if (this.serverProcess && !this.serverProcess.killed && this.serverProcess.stdin) {
      // Gracefully terminate the server process
      this.serverProcess.stdin.end();

      const exitPromise = new Promise<void>((resolve) => {
        this.serverProcess!.on('exit', () => resolve());
      });

      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Server process termination timeout')), 5000);
      });

      try {
        await Promise.race([exitPromise, timeoutPromise]);
        console.log('Server process terminated gracefully');
      } catch (err) {
        console.warn('Server did not terminate gracefully within timeout, forcing termination');
        this.serverProcess.kill();
      }

      this.serverProcess = null;
    }
  }

  private isProcessTerminated(): boolean {
    return this.serverProcess === null || this.serverProcess.killed;
  }
}