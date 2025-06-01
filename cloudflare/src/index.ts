/**
 * CA Ed Code MCP Server - Cloudflare Workers Entry Point
 */

import { Env, MCPRequest } from './types';
import { MCPServer } from './mcp-server';
import { RateLimiter } from './rate-limiter';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Only handle SSE endpoint
    if (url.pathname !== '/sse') {
      return new Response('CA Ed Code MCP Server - Use /sse endpoint for MCP protocol', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }

    // Check if SSE is requested
    const acceptHeader = request.headers.get('Accept') || '';
    if (!acceptHeader.includes('text/event-stream')) {
      return new Response('SSE endpoint - set Accept: text/event-stream', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }

    // Get client IP for rate limiting
    const ip = request.headers.get('CF-Connecting-IP') || 
                request.headers.get('X-Forwarded-For') || 
                'unknown';

    // Initialize rate limiter
    const rateLimiter = new RateLimiter(env);
    
    // Check global rate limit
    const rateLimitResult = await rateLimiter.checkLimit(ip);
    
    // Add rate limit headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.reset.toString(),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    });

    if (!rateLimitResult.allowed) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers
      });
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // Create MCP server instance
    const mcpServer = new MCPServer(env);

    // Create readable stream for SSE
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Handle the SSE connection
    ctx.waitUntil((async () => {
      try {
        // Send initial connection message
        await writer.write(encoder.encode(': ping\n\n'));

        // Read request body as stream
        const reader = request.body?.getReader();
        if (!reader) {
          await writer.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                // Parse JSON-RPC request
                const mcpRequest: MCPRequest = JSON.parse(line);
                
                // Check section-specific rate limit if applicable
                if (mcpRequest.method === 'tools/call' && 
                    mcpRequest.params?.name === 'fetch_ed_code' &&
                    mcpRequest.params?.arguments?.section) {
                  const sectionLimit = await rateLimiter.checkLimit(
                    ip, 
                    mcpRequest.params.arguments.section
                  );
                  
                  if (!sectionLimit.allowed) {
                    const errorResponse = {
                      jsonrpc: '2.0' as const,
                      id: mcpRequest.id,
                      error: {
                        code: -32000,
                        message: 'Rate limit exceeded for this section'
                      }
                    };
                    await writer.write(
                      encoder.encode(MCPServer.formatSSE(errorResponse))
                    );
                    continue;
                  }
                }

                // Handle the request
                const response = await mcpServer.handleRequest(mcpRequest);
                
                // Send SSE response
                await writer.write(
                  encoder.encode(MCPServer.formatSSE(response))
                );
              } catch (error) {
                console.error('Request processing error:', error);
                // Send error response
                const errorResponse = {
                  jsonrpc: '2.0' as const,
                  id: 'error',
                  error: {
                    code: -32700,
                    message: 'Parse error'
                  }
                };
                await writer.write(
                  encoder.encode(MCPServer.formatSSE(errorResponse))
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('SSE error:', error);
      } finally {
        try {
          await writer.close();
        } catch (e) {
          // Stream might already be closed
        }
      }
    })());

    return new Response(readable, { headers });
  }
};