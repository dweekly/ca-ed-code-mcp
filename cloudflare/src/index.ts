/**
 * CA Ed Code MCP Server - Cloudflare Workers Entry Point (Fixed)
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

    // For POST requests with SSE, read the body first
    if (request.method === 'POST') {
      try {
        const body = await request.text();
        
        // Create MCP server instance
        const mcpServer = new MCPServer(env);
        
        // Parse the request
        const mcpRequest: MCPRequest = JSON.parse(body);
        
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
            
            return new Response(MCPServer.formatSSE(errorResponse), { headers });
          }
        }
        
        // Handle the request
        const response = await mcpServer.handleRequest(mcpRequest);
        
        // Return SSE response
        return new Response(MCPServer.formatSSE(response), { headers });
        
      } catch (error) {
        console.error('Request processing error:', error);
        const errorResponse = {
          jsonrpc: '2.0' as const,
          id: 'error',
          error: {
            code: -32700,
            message: 'Parse error'
          }
        };
        return new Response(MCPServer.formatSSE(errorResponse), { headers });
      }
    }

    // For GET requests or establishing SSE connection
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Handle the SSE connection for streaming
    ctx.waitUntil((async () => {
      try {
        // Send initial connection message
        await writer.write(encoder.encode(': ping\n\n'));

        // For GET requests, just keep the connection alive
        if (request.method === 'GET') {
          // Send periodic pings
          const interval = setInterval(async () => {
            try {
              await writer.write(encoder.encode(': ping\n\n'));
            } catch (e) {
              clearInterval(interval);
            }
          }, 30000); // Every 30 seconds

          // Keep connection open
          await new Promise(() => {}); // Never resolves
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