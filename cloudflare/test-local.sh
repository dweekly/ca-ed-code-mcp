#!/bin/bash

echo "Testing CA Ed Code MCP Server locally..."
echo "Make sure 'npm run dev' is running in another terminal!"
echo ""

# Test basic SSE connection
echo "1. Testing SSE endpoint..."
curl -s -N -H "Accept: text/event-stream" http://localhost:8787/sse &
PID=$!
sleep 2
kill $PID 2>/dev/null

echo ""
echo "2. Testing with MCP request..."
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | \
  curl -s -X POST -H "Accept: text/event-stream" -H "Content-Type: application/json" \
  --data-binary @- http://localhost:8787/sse

echo ""
echo ""
echo "3. Testing tool list..."
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | \
  curl -s -X POST -H "Accept: text/event-stream" -H "Content-Type: application/json" \
  --data-binary @- http://localhost:8787/sse

echo ""
echo ""
echo "Test complete! If you see SSE responses above, the server is working."