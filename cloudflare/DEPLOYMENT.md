# CA Ed Code MCP Server - Cloudflare Deployment

## Deployment Status ✅

The CA Ed Code MCP server has been successfully deployed to Cloudflare Workers!

### Production URL
```
https://ca-ed-code-mcp.david-5bf.workers.dev/sse
```

### Deployment Details
- **Worker Name**: ca-ed-code-mcp
- **KV Namespaces**:
  - CACHE: `add58a5e70c24941be51e8ad72fc66dc`
  - RATE_LIMIT: `1403c2115247468ca97c9fda0aaa38c0`
- **Version ID**: `bc29df2d-25d0-421b-834b-826c7eb68058`

## Testing the Deployment

### 1. Test with MCP Inspector
```bash
npx @modelcontextprotocol/inspector sse https://ca-ed-code-mcp.david-5bf.workers.dev/sse
```

### 2. Configure Claude Desktop
Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ca-ed-code-remote": {
      "transport": "sse",
      "url": "https://ca-ed-code-mcp.david-5bf.workers.dev/sse"
    }
  }
}
```

### 3. Test in Claude
Ask Claude: "Can you fetch California Education Code section 15278?"

## Management Commands

### View Logs
```bash
wrangler tail ca-ed-code-mcp
```

### Update Deployment
```bash
npm run deploy
```

### Check KV Storage
```bash
# List all keys in CACHE namespace
wrangler kv key list --namespace-id=add58a5e70c24941be51e8ad72fc66dc

# Get a specific cached value
wrangler kv get "edc:15278" --namespace-id=add58a5e70c24941be51e8ad72fc66dc
```

### Monitor Rate Limits
```bash
# Check rate limit keys
wrangler kv key list --namespace-id=1403c2115247468ca97c9fda0aaa38c0 --prefix="rl:"
```

## Performance Metrics

- **Cold Start**: ~11ms
- **Response Time**: <100ms with cache hit
- **Bundle Size**: 411.84 KiB (101.06 KiB gzipped)

## Rate Limits

- **Global**: 1000 requests/minute per IP
- **Per Section**: 10 requests/minute per section per IP
- **Window**: 60 seconds sliding window

## Next Steps

1. Monitor usage in Cloudflare dashboard
2. Set up alerts for errors or high usage
3. Consider custom domain if needed
4. Add more California code types (Health & Safety, etc.)

## Troubleshooting

If you encounter issues:

1. Check worker logs: `wrangler tail ca-ed-code-mcp`
2. Verify KV namespaces are accessible
3. Test with curl to see raw responses
4. Check rate limit headers in responses

## Cost Monitoring

Current usage is well within free tier limits:
- Workers: 100,000 requests/day free
- KV: 100,000 reads/day, 1,000 writes/day free

Monitor usage at: https://dash.cloudflare.com/