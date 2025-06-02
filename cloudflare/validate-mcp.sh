#!/bin/bash
# Comprehensive validation script for CA Ed Code MCP Server

echo "🧪 Validating CA Ed Code MCP Server..."
echo "====================================="
echo ""

URL="https://ca-ed-code-mcp.david-5bf.workers.dev/sse"

# Test 1: Basic connectivity
echo "1. Testing basic connectivity..."
if curl -s -f "$URL" > /dev/null 2>&1; then
    echo "❌ Failed: SSE endpoint should require proper headers"
else
    echo "✅ Passed: Endpoint requires proper headers"
fi

# Test 2: Initialize
echo ""
echo "2. Testing initialize method..."
RESPONSE=$(curl -s -X POST "$URL" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
  2>&1 | head -20)

if echo "$RESPONSE" | grep -q "protocolVersion"; then
    echo "✅ Passed: Initialize returned protocol version"
else
    echo "❌ Failed: Initialize didn't return expected response"
    echo "Response: $RESPONSE"
fi

# Test 3: List tools
echo ""
echo "3. Testing tools/list method..."
RESPONSE=$(curl -s -X POST "$URL" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  2>&1 | head -20)

if echo "$RESPONSE" | grep -q "fetch_ed_code"; then
    echo "✅ Passed: Tools list includes fetch_ed_code"
else
    echo "❌ Failed: Tools list doesn't include expected tool"
    echo "Response: $RESPONSE"
fi

# Test 4: Fetch actual code
echo ""
echo "4. Testing fetch_ed_code tool..."
RESPONSE=$(curl -s -X POST "$URL" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"fetch_ed_code","arguments":{"section":"15278"}}}' \
  2>&1 | head -50)

if echo "$RESPONSE" | grep -q "Citizens.*Oversight.*Committee"; then
    echo "✅ Passed: Successfully fetched Ed Code section 15278"
else
    echo "❌ Failed: Couldn't fetch Ed Code content"
    echo "Response: $RESPONSE"
fi

# Test 5: Rate limiting headers
echo ""
echo "5. Testing rate limit headers..."
HEADERS=$(curl -s -I -X POST "$URL" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/list","params":{}}' \
  2>&1)

if echo "$HEADERS" | grep -q "X-RateLimit-Limit"; then
    echo "✅ Passed: Rate limit headers present"
    echo "$HEADERS" | grep "X-RateLimit"
else
    echo "❌ Failed: Rate limit headers missing"
fi

# Test 6: Invalid section
echo ""
echo "6. Testing error handling (invalid section)..."
RESPONSE=$(curl -s -X POST "$URL" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"fetch_ed_code","arguments":{"section":"99999"}}}' \
  2>&1 | head -20)

if echo "$RESPONSE" | grep -q "Could not find"; then
    echo "✅ Passed: Proper error message for invalid section"
else
    echo "❌ Failed: No error message for invalid section"
fi

echo ""
echo "🎉 Validation complete!"
echo ""
echo "For more comprehensive testing, try:"
echo "  npx @modelcontextprotocol/inspector sse $URL"