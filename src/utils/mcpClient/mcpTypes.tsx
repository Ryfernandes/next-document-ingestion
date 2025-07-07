// src/utils/mcpClient/mcpTypes.tsx

export type Tool = {
  name: string;
  description: string;
  input_schema: any;
}

export type Message = {
  role: 'user' | 'assistant';
  content: string | any[]
}

export type ToolResult = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type MCPResponse = {
  jsonrpc: string;
  id?: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}