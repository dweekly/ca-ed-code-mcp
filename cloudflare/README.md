# CA Ed Code MCP Server - Cloudflare Workers

This is the Cloudflare Workers implementation of the CA Education Code MCP server, providing remote access to California Education Code sections via the Model Context Protocol.

## Features

- 🌐 Remote MCP server accessible via HTTPS
- 🚀 Deployed on Cloudflare's edge network
- 💾 KV-based caching with 24-hour TTL
- 🔒 Rate limiting (1000 req/min global, 10 req/min per section)
- 📡 Server-Sent Events (SSE) transport
- 🔍 Lightweight HTML parsing

## Setup

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Quick Setup (Recommended)

Use the automated setup script for proper secrets management:

```bash
cd cloudflare
./scripts/setup.sh
npm install
```

This script will:
- Create KV namespaces in your Cloudflare account
- Generate a properly configured `wrangler.toml` (git-ignored)
- Save namespace IDs securely

### Manual Setup

If you prefer manual configuration:

1. Copy the template:
```bash
cp wrangler.toml.example wrangler.toml
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Create KV namespaces:
```bash
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "RATE_LIMIT"
```

4. Update `wrangler.toml` with the KV namespace IDs from the output above.

⚠️ **Important**: Never commit `wrangler.toml` with real IDs to git!

### Development

Run locally with Wrangler:
```bash
npm run dev
```

Test with curl:
```bash
# Test SSE connection
curl -N -H "Accept: text/event-stream" http://localhost:8787/sse

# Test with MCP Inspector
npx @modelcontextprotocol/inspector sse http://localhost:8787/sse
```

### Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```

Your server will be available at:
```
https://ca-ed-code-mcp.{your-subdomain}.workers.dev/sse
```

## Configuration

Environment variables in `wrangler.toml`:

- `CACHE_TTL`: Cache time-to-live in seconds (default: 86400)
- `GLOBAL_RATE_LIMIT`: Requests per minute per IP (default: 1000)
- `SECTION_RATE_LIMIT`: Requests per minute per section per IP (default: 10)
- `RATE_LIMIT_WINDOW`: Rate limit window in seconds (default: 60)
- `LOG_LEVEL`: Logging level (default: info)

## Usage with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ca-ed-code-remote": {
      "transport": "sse",
      "url": "https://ca-ed-code-mcp.{your-subdomain}.workers.dev/sse"
    }
  }
}
```

## Testing

Run tests:
```bash
npm test
```

Run type checking:
```bash
npm run typecheck
```

## Security

This project implements several security measures:

### Secrets Management
- **Never commit** `wrangler.toml` with real namespace IDs
- Use the provided setup script for automatic configuration
- All sensitive files are git-ignored
- See [SECRETS.md](SECRETS.md) for detailed security practices

### Pre-commit Hook (Optional)
Install the pre-commit hook to prevent accidental secret commits:
```bash
cp scripts/pre-commit.sh ../.git/hooks/pre-commit
```

### Best Practices
- Use environment-specific configurations
- Rotate namespace IDs periodically
- Monitor access logs in Cloudflare dashboard
- Keep dependencies updated

## Monitoring

Monitor your deployment:
```bash
# Tail logs
wrangler tail

# View metrics in Cloudflare dashboard
# https://dash.cloudflare.com/
```

## Rate Limits

The server implements two levels of rate limiting:

1. **Global**: 1000 requests/minute per IP address
2. **Per Section**: 10 requests/minute per section per IP address

Rate limit information is returned in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

## Architecture

```
Client (Claude) → Cloudflare Edge → Workers Runtime
                                   ↓
                              Parse Request
                                   ↓
                            Check Rate Limits (KV)
                                   ↓
                            Check Cache (KV)
                                   ↓ (miss)
                          Fetch from CA Legislature
                                   ↓
                             Parse HTML
                                   ↓
                           Update Cache (KV)
                                   ↓
                           Return Response (SSE)
```

## Troubleshooting

### Rate Limit Errors
- Status: 429 Too Many Requests
- Solution: Wait for rate limit window to reset (see X-RateLimit-Reset header)

### Parse Errors
- Check logs with `wrangler tail`
- Verify CA Legislature website structure hasn't changed

### Cache Issues
- Cache automatically expires after 24 hours
- No manual cache clearing needed in production

## Cost Estimation

Based on Cloudflare Workers pricing:

- **Free tier**: 100,000 requests/day
- **Paid**: $5/month base + $0.50 per million requests
- **KV**: Free tier includes 100,000 reads/day, 1,000 writes/day

Typical usage (1,000 requests/day with 90% cache hit rate):
- Workers requests: Free tier
- KV reads: ~900/day (well within free tier)
- KV writes: ~100/day (well within free tier)
- **Estimated cost**: $0/month

## Contributing

See main repository CONTRIBUTING.md for guidelines.

## License

MIT - See LICENSE in root directory