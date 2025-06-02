#!/bin/bash

echo "Testing deployed CA Ed Code MCP Server..."
echo "URL: https://ca-ed-code-mcp.david-5bf.workers.dev/sse"
echo ""

# Test with MCP Inspector
echo "Testing with MCP Inspector..."
echo "Run this command in your terminal:"
echo ""
echo "npx @modelcontextprotocol/inspector sse https://ca-ed-code-mcp.david-5bf.workers.dev/sse"
echo ""
echo "Or test manually:"
echo ""

# Test initialize
echo "1. Testing initialize..."
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | \
  curl -s -X POST -H "Accept: text/event-stream" -H "Content-Type: application/json" \
  --data-binary @- https://ca-ed-code-mcp.david-5bf.workers.dev/sse | head -20

echo ""
echo "2. Testing tools/list..."
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | \
  curl -s -X POST -H "Accept: text/event-stream" -H "Content-Type: application/json" \
  --data-binary @- https://ca-ed-code-mcp.david-5bf.workers.dev/sse | head -20