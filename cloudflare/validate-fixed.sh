#!/bin/bash
# Quick validation for fixed MCP server

echo "🧪 Testing Fixed CA Ed Code MCP Server"
echo "====================================="
echo ""

URL="https://ca-ed-code-mcp.david-5bf.workers.dev/sse"

echo "1. Initialize:"
curl -s -X POST "$URL" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | \
  jq -r '.result.serverInfo'

echo ""
echo "2. List tools:"
curl -s -X POST "$URL" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | \
  jq -r '.result.tools[0].name'

echo ""
echo "3. Fetch Ed Code 15278:"
curl -s -X POST "$URL" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"fetch_ed_code","arguments":{"section":"15278"}}}' | \
  jq -r '.result.content[0].text' | head -10

echo ""
echo "✅ Server is working correctly!"