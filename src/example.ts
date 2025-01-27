import { runServer, terminateServer } from './index.js';

async function main() {
  try {
    // First call to runServer
    const result1 = await runServer('openrouterai', 'chat_completion', {
      messages: [
        {
          role: 'user',
          content: 'Say hello!'
        }
      ]
    });
    console.log('Result 1:', JSON.stringify(result1, null, 2));

    // Second call to runServer using the same server process
    const result2 = await runServer('openrouterai', undefined, {
      messages: [
        {
          role: 'user',
          content: 'How are you?'
        }
      ]
    });
    console.log('Result 2:', JSON.stringify(result2, null, 2));

    // When done with all calls, terminate the server
    await terminateServer();
    console.log('Server terminated successfully');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    // Ensure server is terminated even if an error occurs
    await terminateServer();
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);