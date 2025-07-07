import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { createInterface } from 'readline';

import type {
  Tool,
  Message,
  ToolResult,
  MCPResponse
} from './mcpTypes';

class MCPClient {
  private anthropic: Anthropic;
  private maxIterations: number = 20;
  private messageId: number = 0;
  private serverUrl: string;
  private pendingRequests: Map<number, {resolve: Function; reject: Function}> = new Map();

  constructor(serverUrl: string) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.serverUrl = serverUrl.replace(/\/$/, '')
  }

  async connectToSever(): Promise<void> {
    try {
      await this.initializeSession();
      const tools = await this.listTools();
      console.log('\nConnected to SSE server with tools: ', tools.map(t => t.name));
    } catch (error) {
      throw new Error(`Failed to connect to MCP server at ${this.serverUrl}: ${error}`);
    }
  }

  private async initializeSession(): Promise<void> {
    const initMessage = {
      jsponrpc: '2.0',
      id: this.getNextId(),
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        clientInfo: {
          name: 'typescript-mcp-sse-client',
          version: '1.0.0',
        },
      }
    };

    await this.sendMessage(initMessage);
  }

  private async listTools(): Promise<Tool[]> {
    const message = {
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'tools/list',
      params: {},
    };

    const response = await this.sendMessage(message);
    return response.result.tools || [];
  }

  private async callTool(toolName: string, args: any): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    };

    const response = await this.sendMessage(message);
    return response.result;
  }

  private async sendMessage(message: any): Promise<MCPResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        if (message.id) {
          this.pendingRequests.set(message.id, { resolve, reject })
        }

        const response = await fetch(`${this.serverUrl}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (response.headers.get('content-type')?.includes('text/event-stream')) {
          this.handleSSEResponse(response, message.id);
        } else {
          const jsonResponse = await response.json();
          this.handleResponse(jsonResponse);
        }

        // HERE

        setTimeout(() => {
          if (message.id && this.pendingRequests.has(message.id)) {
            this.pendingRequests.delete(message.id);
            reject(new Error('Request timeout'));
          }
        }, 30000);
      } catch (error) {
        if (message.id) {
          this.pendingRequests.delete(message.id);
        }
        reject(error);
      }
    });
  }

  private async handleSSEResponse(response: Response, messageId?: number): Promise<void> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body reader available');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const jsonData = JSON.parse(data);
              this.handleSSEResponse(jsonData);
            } catch (e) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private handleResponse(response: MCPResponse): void {
    if (response.id && this.pendingRequests.has(response.id)) {
      const { resolve, reject } = this.pendingRequests.get(response.id)!;
      this.pendingRequests.delete(response.id);

      if (response.error) {
        reject(new Error(`MCP Error: ${response.error.message}`));
      } else {
        resolve(response);
      }
    }
  }

  private getNextId(): number {
    return ++this.messageId;
  }

  async processQuery(query: string, conversationSummary?: string): Promise<[string, string]> {
    const messages: Message[] = [];

    if (conversationSummary) {
      messages.push({
        role: 'assistant',
        content: `Previous conversation context: ${conversationSummary}`,
      });
    }

    messages.push({
      role: 'user',
      content: query,
    });

    const availableTools = await this.listTools();
    const executionLog: string[] = [];
    let iteration = 0;

    while (iteration < this.maxIterations) {
      iteration++;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: messages as any,
        tools: availableTools as any,
      });

      let hasToolCalls = false;
      const assistantMessageContent: any[] = [];
      const toolResults: ToolResult[] = [];

      for (const content of response.content) {
        if (content.type === 'text') {
          executionLog.push(`Claude: ${content.text}`);
          assistantMessageContent.push(content.text);
        } else if (content.type === 'tool_use') {
          hasToolCalls = true;
          const toolName = content.name;
          const toolArgs = content.input;

          executionLog.push(`🔧 Calling tool: '${toolName}' with args: ${JSON.stringify(toolArgs)}`);

          try {
            const result = await this.callTool(toolName, toolArgs);
            executionLog.push(`✅ Tool result: ${JSON.stringify(result.content)}`);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: content.id,
              content: Array.isArray(result.content) ? result.content[0].text : result.content,
            });
          } catch (error) {
            executionLog.push(`❌ Tool error: ${error}`);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: content.id,
              content: `Error ${error}}`,
              is_error: true,
            });
          }

          assistantMessageContent.push(content);
        }
      }

      if (hasToolCalls) {
        messages.push({ role: 'assistant', content: assistantMessageContent });
        messages.push({ role: 'user', content: toolResults });
      } else {
        break;
      }
    }

    if (iteration >= this.maxIterations) {
      executionLog.push(`⚠️ Reached maximum iterations (${this.maxIterations})`);
    }

    console.log(`\nSystem: Compressing conversation context...`)

    const summary = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [
        ...messages,
        {
          role: 'user',
          content: 'Please provide a brief summary of the conversation so far. Make surce to prioritize the user\'s goals, actions taken, and any important data like document keys that will be important for the continuation of work. List the most recent actions first',
        },
      ] as any,
    });

    const newSummary = summary.content[0].type === 'text' ? summary.content[0].text : '';

    return [executionLog.join('\n'), newSummary];
  }

  async processQueryWithStreaming(query: string): Promise<string> {
    const messages: Message[] =[
      {
        role: 'user',
        content: query,
      },
    ];

    const availableTools = await this.listTools();

    console.log(`\n🤖 Processing: ${query}`);
    let iteration = 0;

    while (iteration < this.maxIterations) {
      iteration ++;
      console.log(`\n--- Iteration ${iteration} ---`);

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: messages as any,
        tools: availableTools as any,
      });

      const assistantMessageContent: any[] = [];
      let hasToolCalls = false;

      for (const content of response.content) {
        assistantMessageContent.push(content);

        if (content.type === 'text') {
          console.log(`Claude: ${content.text}`);
        } else if (content.type === 'tool_use') {
          hasToolCalls = true;
          const toolName = content.name;
          const toolArgs = content.input;

          console.log(`🔧 Calling '${toolName}'...`);

          try {
            const result = await this.callTool(toolName, toolArgs);
            console.log('✅ Success');

            messages.push({
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: content.id,
                  content: Array.isArray(result.content) ? result.content[0].text : result.content,
                },
              ],
            });
          } catch (error) {
            console.log(`❌ Error: ${error}`);
            messages.push({
              role: 'assistant',
              content: assistantMessageContent,
            });
            messages.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_user_id: content.id,
                  content: `Error: ${error}`,
                  is_error: true,
                },
              ],
            });
          }
        }
      }

      if (!hasToolCalls) {
        console.log('🏁 Task complete!');
        break;
      }
    }

    if (iteration >= this.maxIterations) {
      console.log(`⚠️ Reached maximum iterations (${this.maxIterations})`);
    }

    return 'Task completed!';
  }

  async chatLoop(): Promise<void> {
    let context = 'None. Start of a new conversation.';

    console.log('\Agentic MCP SSE Client ready');
    console.log("Type queries, 'stream' for streaming mode, or 'quit' to exit");

    let streamingMode = false;
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(prompt, resolve);
      });
    };

    while (true) {
      try {
        const query = await askQuestion(
          `\nQuery${streamingMode ? ' (streaming)' : ''}: `
        );

        if (query.toLowerCase() === 'quit') {
          break;
        } else if (query.toLowerCase() === 'stream') {
          streamingMode = !streamingMode;
          console.log(`Streaming mode ${streamingMode ? 'ON' : 'OFF'}`);
          continue;
        } else if (query.toLowerCase() === 'context') {
          console.log(`Current context: ${context}`);
          continue;
        } else if (query.toLowerCase() === 'reset') {
          context = 'None. Start of a new conversation.';
          console.log('\nContext reset.');
          continue;
        }

        if (streamingMode) {
          await this.processQueryWithStreaming(query);
        } else {
          const [response, newContext] = await this.processQuery(query, context);
          context = newContext;
          console.log('\n' + response);
        }
      } catch (error) {
        console.log(`\nError: ${error}`);
        console.error(error);
      }
    }

    rl.close();
  }

  async cleanup(): Promise<void> {
    this.pendingRequests.clear();
  }
}

async function main(): Promise<void> {
  dotenv.config();

  const serverUrl = process.env.MCP_SERVER_URL || 'http://localhost:3000';
  const client = new MCPClient(serverUrl);

  try {
    await client.connectToSever();
    await client.chatLoop();
  } finally {
    await client.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}