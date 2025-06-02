/**
 * MCP Server implementation for Cloudflare Workers
 */

import { Env, MCPRequest, MCPResponse, MCPTool, MCPError, SSEMessage } from './types';
import { EdCodeParser } from './parser';
import { Cache } from './cache';

export class MCPServer {
  private cache: Cache;

  constructor(env: Env) {
    this.cache = new Cache(env);
  }

  /**
   * Handle MCP request
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);
        
        case 'tools/list':
          return this.handleToolsList(request);
        
        case 'tools/call':
          return await this.handleToolCall(request);
        
        default:
          return this.error(request.id, -32601, 'Method not found');
      }
    } catch (error) {
      console.error('MCP request error:', error);
      return this.error(request.id, -32603, 'Internal error');
    }
  }

  /**
   * Handle initialize request
   */
  private handleInitialize(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '0.1.0',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'ca-ed-code-mcp',
          version: '0.1.0'
        }
      }
    };
  }

  /**
   * Handle tools/list request
   */
  private handleToolsList(request: MCPRequest): MCPResponse {
    const tools: MCPTool[] = [
      {
        name: 'fetch_ed_code',
        description: 'Fetch California Education Code section content by section number',
        inputSchema: {
          type: 'object',
          properties: {
            section: {
              type: 'string',
              description: "The Ed Code section number (e.g., '15278', '44237.5')"
            }
          },
          required: ['section']
        }
      }
    ];

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools }
    };
  }

  /**
   * Handle tools/call request
   */
  private async handleToolCall(request: MCPRequest): MCPResponse {
    const { name, arguments: args } = request.params || {};

    if (name !== 'fetch_ed_code') {
      return this.error(request.id, -32602, 'Unknown tool');
    }

    if (!args || !args.section) {
      return this.error(request.id, -32602, 'Missing required parameter: section');
    }

    const section = String(args.section).trim();
    
    // Validate section format
    if (!/^\d+(\.\d+)?$/.test(section)) {
      return this.error(request.id, -32602, 'Invalid section format');
    }

    try {
      // Check cache first
      let result = await this.cache.get(section);
      
      if (!result) {
        // Fetch from website
        const url = EdCodeParser.buildUrl(section);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CA-Ed-Code-MCP/1.0)'
          }
        });

        if (!response.ok) {
          return this.error(request.id, -32000, `Failed to fetch section ${section}`);
        }

        const html = await response.text();
        result = EdCodeParser.parseSection(html, section);

        if (!result) {
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Error: Could not find California Education Code section ${section}. Please verify the section number exists.`
                }
              ],
              isError: true
            }
          };
        }

        // Add fetch timestamp
        result.fetchedAt = new Date().toISOString();

        // Cache the result
        await this.cache.set(section, result);
      }

      // Return structured response
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: result.content
            }
          ],
          isError: false,
          // Additional structured metadata
          section: result.section,
          title: result.title,
          url: result.url,
          fetchedAt: result.fetchedAt || new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Tool call error:', error);
      return this.error(request.id, -32000, 'Failed to fetch Ed Code section');
    }
  }

  /**
   * Create error response
   */
  private error(id: string | number, code: number, message: string): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message }
    };
  }

  /**
   * Format SSE message
   */
  static formatSSE(message: MCPResponse): string {
    const sseMessage: SSEMessage = {
      data: JSON.stringify(message)
    };
    
    let output = '';
    if (sseMessage.id) output += `id: ${sseMessage.id}\n`;
    if (sseMessage.event) output += `event: ${sseMessage.event}\n`;
    output += `data: ${sseMessage.data}\n\n`;
    
    return output;
  }
}