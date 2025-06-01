# CA Ed Code MCP Server - Cloudflare Workers Implementation Plan

## Confirmed Architecture Decisions

Based on discussion, we're implementing:

- **Public access** - No authentication required
- **Rate limits** - 1000 req/min global, 10 req/min per section per IP
- **HTML parsing in Workers** - Using lightweight parsing libraries
- **Single region deployment** - Optimized for California users
- **Focus on simplicity** - Single tool (`fetch_ed_code`) for initial release

## Implementation Roadmap

### Step 1: Project Structure Setup

```
ca-ed-code-mcp/
├── cloudflare/
│   ├── src/
│   │   ├── index.ts           # Main worker entry point
│   │   ├── mcp-server.ts      # MCP SSE server implementation
│   │   ├── tools.ts           # fetch_ed_code tool
│   │   ├── parser.ts          # HTML parsing logic
│   │   ├── cache.ts           # KV cache wrapper
│   │   ├── rate-limiter.ts   # Rate limiting logic
│   │   └── types.ts           # TypeScript definitions
│   ├── test/
│   │   └── *.test.ts          # Tests
│   ├── wrangler.toml          # Cloudflare configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md              # Cloudflare-specific docs
```

### Step 2: Core Components

#### 2.1 MCP SSE Server (`mcp-server.ts`)
- Handle SSE connection establishment
- Process JSON-RPC 2.0 messages
- Route to appropriate tool handlers
- Stream responses back to client

#### 2.2 HTML Parser (`parser.ts`)
- Port Python BeautifulSoup logic to TypeScript
- Use `node-html-parser` or similar lightweight library
- Extract section content, title, and clean formatting
- Handle edge cases gracefully

#### 2.3 Cache Layer (`cache.ts`)
- Wrapper around Cloudflare KV
- Implement get/set with TTL
- Handle cache misses gracefully
- Add cache statistics tracking

#### 2.4 Rate Limiter (`rate-limiter.ts`)
- Use Cloudflare KV for distributed rate limiting
- Implement sliding window algorithm
- Return appropriate rate limit headers
- Handle both global and per-section limits

### Step 3: Development Tasks

#### Week 1: Foundation
- [ ] Set up Cloudflare Workers project
- [ ] Create TypeScript boilerplate
- [ ] Implement basic SSE endpoint
- [ ] Port HTML parsing logic
- [ ] Basic KV cache implementation
- [ ] Local testing with Wrangler

#### Week 2: Full Implementation
- [ ] Complete MCP protocol implementation
- [ ] Add rate limiting
- [ ] Error handling and logging
- [ ] Integration testing
- [ ] Deploy to Workers
- [ ] Test with MCP Inspector

#### Week 3: Polish & Launch
- [ ] Performance optimization
- [ ] Add monitoring/analytics
- [ ] Documentation updates
- [ ] Public announcement
- [ ] Monitor initial usage

## Technical Implementation Details

### HTML Parsing Strategy

Since Workers doesn't have native DOM parsing, we'll use a lightweight approach:

```typescript
// Option 1: node-html-parser (recommended)
import { parse } from 'node-html-parser';

// Option 2: Regular expressions for specific patterns
// Fallback if parsing libraries are too heavy
```

### KV Cache Key Design

```typescript
interface CacheEntry {
  section: string;
  title: string;
  content: string;
  url: string;
  cachedAt: number;
  ttl: number;
}

// Key format: "edc:15278"
// Value: JSON.stringify(CacheEntry)
```

### Rate Limiting Implementation

```typescript
// Global rate limit key: "rl:global:{ip}"
// Section rate limit key: "rl:section:{section}:{ip}"
// Value: { count: number, windowStart: number }
```

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: number;
    message: string;
    details?: string;
  };
}

// Common errors:
// 429 - Rate limit exceeded
// 404 - Section not found
// 503 - Upstream service unavailable
// 500 - Internal server error
```

## Deployment Configuration

### Wrangler.toml
```toml
name = "ca-ed-code-mcp"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
kv_namespaces = [
  { binding = "CACHE", id = "YOUR_KV_NAMESPACE_ID" },
  { binding = "RATE_LIMIT", id = "YOUR_RL_NAMESPACE_ID" }
]

[env.production.vars]
CACHE_TTL = "86400"
GLOBAL_RATE_LIMIT = "1000"
SECTION_RATE_LIMIT = "10"
LOG_LEVEL = "info"
```

### Environment Setup Commands
```bash
# Create KV namespaces
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "RATE_LIMIT"

# Deploy
wrangler deploy

# Tail logs
wrangler tail
```

## Testing Strategy

### Local Testing
1. Use Wrangler dev server
2. Mock KV namespaces
3. Test with curl/httpie
4. Validate with MCP Inspector

### Integration Testing
```bash
# Test SSE connection
curl -N -H "Accept: text/event-stream" \
  https://ca-ed-code.{account}.workers.dev/sse

# Test with MCP Inspector
npx @modelcontextprotocol/inspector \
  sse https://ca-ed-code.{account}.workers.dev/sse
```

### Load Testing
- Use k6 or similar tool
- Test rate limiting behavior
- Verify cache performance
- Monitor Worker metrics

## Monitoring & Observability

### Key Metrics
- Request count and latency
- Cache hit ratio
- Rate limit rejections
- Upstream failures
- Worker CPU time

### Logging Strategy
```typescript
// Structured logging
console.log(JSON.stringify({
  level: 'info',
  event: 'cache_hit',
  section: '15278',
  duration_ms: 5,
  timestamp: Date.now()
}));
```

## Migration Checklist

- [ ] Create Cloudflare account
- [ ] Install Wrangler CLI
- [ ] Set up Workers project
- [ ] Create KV namespaces
- [ ] Deploy initial version
- [ ] Test with MCP Inspector
- [ ] Update documentation
- [ ] Announce availability

## Cost Monitoring

Track these metrics weekly:
- Total requests
- KV read/write operations
- Worker CPU time
- Bandwidth usage

Alert thresholds:
- > 50k requests/day (50% of free tier)
- > 500 KV writes/day (50% of free tier)
- > $10/month estimated cost

## Success Criteria

Week 1:
- Basic SSE server responding to requests
- HTML parsing working for test sections
- Local development environment functional

Week 2:
- Full MCP protocol implementation
- Rate limiting active
- Deployed to Workers
- Successfully tested with Claude Desktop

Week 3:
- < 100ms p50 latency
- > 90% cache hit ratio
- Zero critical errors
- Public documentation complete

## Next Steps

1. Confirm this implementation plan
2. Set up Cloudflare Workers account
3. Begin TypeScript project setup
4. Start with SSE server implementation
5. Port HTML parsing logic

This plan provides a clear path to deploying a public CA Ed Code MCP server on Cloudflare Workers within 3 weeks.