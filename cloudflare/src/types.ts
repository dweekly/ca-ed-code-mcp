/**
 * Type definitions for CA Ed Code MCP Server
 */

export interface Env {
  CACHE: KVNamespace;
  RATE_LIMIT: KVNamespace;
  CACHE_TTL: string;
  GLOBAL_RATE_LIMIT: string;
  SECTION_RATE_LIMIT: string;
  RATE_LIMIT_WINDOW: string;
  LOG_LEVEL: string;
}

export interface EdCodeSection {
  section: string;
  title: string;
  content: string;
  url: string;
}

export interface CacheEntry extends EdCodeSection {
  cachedAt: number;
  ttl: number;
}

export interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface SSEMessage {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
}