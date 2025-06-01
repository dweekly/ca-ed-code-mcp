# CA Ed Code MCP Server - Cloudflare Workers Architecture

## Overview

This document outlines the architecture and implementation plan for deploying the CA Ed Code MCP server as a remote service on Cloudflare Workers, following best practices for security, performance, and scalability.

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│                 │     │                     │     │                  │
│  Claude/Client  │────▶│ Cloudflare Workers  │────▶│ CA Legislature   │
│   (MCP Client)  │◀────│  (MCP SSE Server)   │◀────│    Website       │
│                 │     │                     │     │                  │
└─────────────────┘     └─────────────────────┘     └──────────────────┘
         │                        │
         │                        ▼
         │              ┌─────────────────────┐
         │              │                     │
         └─────────────▶│   Cloudflare KV     │
                        │   (Cache Storage)   │
                        │                     │
                        └─────────────────────┘
```

## Key Components

### 1. Transport Layer
- **Protocol**: Server-Sent Events (SSE) over HTTP
- **Endpoint**: `/sse` for MCP communication
- **Format**: JSON-RPC 2.0 messages

### 2. Authentication Strategy
We'll implement a **two-phase approach**:

#### Phase 1: Public Server (Initial Implementation)
- No authentication required
- Rate limiting via Cloudflare
- IP-based access controls
- Suitable for testing and public use

#### Phase 2: OAuth-Authenticated Server (Future Enhancement)
- GitHub OAuth for developer access
- Scoped permissions for different user types
- Token-based authentication
- User activity tracking

### 3. Caching Strategy
- **Primary**: Cloudflare KV for distributed caching
- **TTL**: 24 hours (configurable)
- **Key Format**: `edc:{section}:{timestamp}`
- **Fallback**: In-memory cache for hot data

### 4. Rate Limiting
- **Global**: 1000 requests/minute per IP
- **Per Section**: 10 requests/minute per section per IP
- **Burst Protection**: Cloudflare's built-in DDoS protection

## Implementation Plan

### Phase 1: Basic Remote Server (Week 1)

#### 1.1 Project Setup
```
ca-ed-code-mcp/
├── cloudflare/
│   ├── src/
│   │   ├── index.ts        # Main worker entry
│   │   ├── mcp/
│   │   │   ├── server.ts   # MCP SSE server
│   │   │   └── tools.ts    # Tool definitions
│   │   ├── scraper/
│   │   │   └── edcode.ts   # Web scraping logic
│   │   └── cache/
│   │       └── kv.ts       # KV cache implementation
│   ├── wrangler.toml       # Cloudflare config
│   ├── package.json
│   └── tsconfig.json
```

#### 1.2 Core Features
- SSE endpoint for MCP protocol
- `fetch_ed_code` tool implementation
- KV-based caching
- Error handling and logging

#### 1.3 Deployment Steps
1. Create Cloudflare account and Workers project
2. Set up Wrangler CLI
3. Configure KV namespace for caching
4. Deploy worker
5. Test with MCP inspector

### Phase 2: Enhanced Features (Week 2)

#### 2.1 Performance Optimizations
- Request coalescing for duplicate requests
- Streaming responses for large sections
- Cache warming for popular sections

#### 2.2 Monitoring & Analytics
- Request metrics to Workers Analytics
- Cache hit/miss ratios
- Error tracking with Sentry integration

#### 2.3 Security Hardening
- CORS configuration
- Request validation
- Input sanitization
- Rate limit headers

### Phase 3: Authentication & Advanced Features (Future)

#### 3.1 OAuth Implementation
- GitHub OAuth provider
- JWT token generation
- Permission scopes:
  - `read:basic` - Access to common sections
  - `read:all` - Access to all sections
  - `read:bulk` - Bulk operations

#### 3.2 Advanced Tools
- `search_ed_code` - Full-text search
- `get_ed_code_history` - Amendment tracking
- `export_ed_code` - PDF/Markdown export

## Technical Decisions

### 1. TypeScript vs JavaScript
**Decision**: TypeScript
- Better type safety for MCP protocol
- Cloudflare Workers has excellent TS support
- Easier refactoring and maintenance

### 2. Web Scraping in Workers
**Challenge**: Workers have no DOM parser
**Solution**: 
- Use `htmlparser2` or similar lightweight parser
- Alternative: Create a separate scraping API on a traditional server
- For MVP: Use regex-based extraction

### 3. KV vs Durable Objects
**Decision**: KV for caching
- Simpler implementation
- Cost-effective for read-heavy workload
- Adequate performance for our use case

### 4. Error Handling Strategy
- Graceful degradation on CA website errors
- Clear error messages in MCP responses
- Automatic retry with exponential backoff
- Circuit breaker for upstream failures

## Security Considerations

### 1. Input Validation
- Strict validation of section numbers
- Prevent injection attacks
- Rate limit by section pattern

### 2. Data Privacy
- No user data storage in Phase 1
- Logs contain only anonymized data
- Cache keys don't contain PII

### 3. Access Control
- Cloudflare Access for admin endpoints
- IP allowlisting option
- Geographic restrictions if needed

## Cost Estimation

### Cloudflare Workers (Free Tier)
- 100,000 requests/day
- 10ms CPU time/invocation
- Sufficient for initial deployment

### Cloudflare KV (Free Tier)
- 100,000 reads/day
- 1,000 writes/day
- 1GB storage

### Estimated Monthly Cost (Scale)
- 1M requests: ~$5
- 10M requests: ~$50
- KV operations: ~$5-10

## Migration Path

### From Local to Remote
1. Deploy basic worker without auth
2. Test with MCP inspector
3. Update Claude Desktop config to use remote URL
4. Monitor performance and errors
5. Gradually add features

### Configuration Changes
```json
{
  "mcpServers": {
    "ca-ed-code": {
      "transport": "sse",
      "url": "https://ca-ed-code.username.workers.dev/sse"
    }
  }
}
```

## Development Workflow

### Local Development
1. Use Wrangler for local testing
2. Mock KV store for offline development
3. Test with MCP inspector
4. Validate with curl/httpie

### CI/CD Pipeline
1. GitHub Actions for testing
2. Automated deployment on main branch
3. Preview deployments for PRs
4. Rollback capability

## Monitoring & Maintenance

### Key Metrics
- Request latency (p50, p95, p99)
- Cache hit ratio
- Error rates by type
- Upstream availability

### Alerts
- High error rates (>1%)
- Slow responses (>2s)
- Cache failures
- Upstream outages

## Open Questions for Discussion

1. **Authentication Timeline**: Should we launch with public access or wait for OAuth?

2. **Caching Strategy**: Is 24-hour TTL appropriate, or should we check for updates more frequently?

3. **Rate Limits**: What are reasonable limits for public access?

4. **Additional Features**: Should we support bulk operations from day one?

5. **Scraping Approach**: Use lightweight parsing in Workers or separate scraping service?

6. **Cost Threshold**: At what usage level should we implement authentication?

7. **Geographic Distribution**: Should we deploy to multiple regions?

## Next Steps

1. Review and approve architecture
2. Set up Cloudflare account and Workers
3. Create TypeScript project structure
4. Implement basic SSE server
5. Port scraping logic to Workers environment
6. Deploy and test Phase 1

## Appendix: Technology Choices

### Required Dependencies
- `@cloudflare/workers-types` - TypeScript types
- `hono` or similar - Lightweight router
- `htmlparser2` - HTML parsing
- `jsonrpc-lite` - JSON-RPC handling

### Development Tools
- `wrangler` - Cloudflare CLI
- `vitest` - Testing framework
- `prettier` - Code formatting
- `eslint` - Linting

This architecture provides a solid foundation for a scalable, secure, and performant remote MCP server while maintaining flexibility for future enhancements.