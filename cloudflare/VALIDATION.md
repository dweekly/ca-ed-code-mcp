# MCP Server Validation Guide

This guide provides multiple ways to validate that the CA Ed Code MCP server is working correctly using third-party tools and services.

## 1. MCP Inspector (Official Tool)

The official MCP debugging tool from Anthropic:

```bash
# Install and run
npx @modelcontextprotocol/inspector sse https://ca-ed-code-mcp.david-5bf.workers.dev/sse
```

This will open an interactive UI where you can:
- See available tools
- Test the `fetch_ed_code` tool
- Monitor request/response flow
- Debug any issues

## 2. Online SSE Testing Tools

### SSE Test Client
Use an online SSE tester to verify the endpoint:

1. Visit: https://sse-tester.herokuapp.com/ or https://www.ssetest.com/
2. Enter URL: `https://ca-ed-code-mcp.david-5bf.workers.dev/sse`
3. Add header: `Accept: text/event-stream`
4. Connect and send test messages

### Reqbin
Online API testing tool:

1. Visit: https://reqbin.com/
2. Set method to POST
3. URL: `https://ca-ed-code-mcp.david-5bf.workers.dev/sse`
4. Headers:
   ```
   Accept: text/event-stream
   Content-Type: application/json
   ```
5. Body:
   ```json
   {"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
   ```

## 3. Postman

Create a comprehensive test suite:

```javascript
// Postman Collection
{
  "info": {
    "name": "CA Ed Code MCP Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Initialize",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Accept", "value": "text/event-stream"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{}}"
        },
        "url": "https://ca-ed-code-mcp.david-5bf.workers.dev/sse"
      }
    },
    {
      "name": "List Tools",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Accept", "value": "text/event-stream"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\",\"params\":{}}"
        },
        "url": "https://ca-ed-code-mcp.david-5bf.workers.dev/sse"
      }
    },
    {
      "name": "Fetch Ed Code 15278",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Accept", "value": "text/event-stream"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"fetch_ed_code\",\"arguments\":{\"section\":\"15278\"}}}"
        },
        "url": "https://ca-ed-code-mcp.david-5bf.workers.dev/sse"
      }
    }
  ]
}
```

## 4. Insomnia

Alternative to Postman with better SSE support:

1. Download Insomnia: https://insomnia.rest/
2. Create new request collection
3. Set up SSE streaming request
4. Test all MCP methods

## 5. HTTPie (Command Line)

Simple command-line testing:

```bash
# Install httpie
brew install httpie  # macOS
# or
pip install httpie

# Test requests
http POST https://ca-ed-code-mcp.david-5bf.workers.dev/sse \
  Accept:text/event-stream \
  Content-Type:application/json \
  jsonrpc=2.0 \
  id=1 \
  method=initialize \
  params:='{}'
```

## 6. Automated Monitoring Services

### Better Uptime
Free monitoring with 10 monitors:

1. Sign up at: https://betteruptime.com/
2. Create new monitor
3. Monitor type: API
4. URL: `https://ca-ed-code-mcp.david-5bf.workers.dev/sse`
5. Add request body for health check

### Pingdom
Professional monitoring:

1. Create synthetic API test
2. Multi-step transaction to test full flow
3. Alert on failures

### UptimeRobot
Free monitoring (50 monitors):

1. Sign up at: https://uptimerobot.com/
2. Add new monitor
3. Monitor type: HTTP(S)
4. Advanced settings for POST requests

## 7. Load Testing

### Loader.io
Free load testing:

1. Sign up at: https://loader.io/
2. Verify domain ownership
3. Create test:
   - Target: `https://ca-ed-code-mcp.david-5bf.workers.dev/sse`
   - Method: POST
   - Headers and body for MCP request
   - Test rate limits

### k6 Cloud
Professional load testing:

```javascript
// k6 test script
import http from 'k6/http';
import { check } from 'k6';

export default function() {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
  };

  const res = http.post(
    'https://ca-ed-code-mcp.david-5bf.workers.dev/sse',
    payload,
    params
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => r.body.includes('data:'),
  });
}
```

## 8. Browser-Based Testing

### Simple HTML Test Page

Create `test.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>MCP SSE Test</title>
</head>
<body>
    <h1>CA Ed Code MCP Test</h1>
    <button onclick="testMCP()">Test Server</button>
    <pre id="output"></pre>

    <script>
    function testMCP() {
        const output = document.getElementById('output');
        output.textContent = 'Connecting...\n';

        fetch('https://ca-ed-code-mcp.david-5bf.workers.dev/sse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/list',
                params: {}
            })
        })
        .then(response => response.text())
        .then(data => {
            output.textContent += 'Response:\n' + data;
        })
        .catch(err => {
            output.textContent += 'Error: ' + err;
        });
    }
    </script>
</body>
</html>
```

## 9. GitHub Actions (CI/CD)

Add to `.github/workflows/test-mcp.yml`:

```yaml
name: Test MCP Server
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test Initialize
        run: |
          curl -f -X POST https://ca-ed-code-mcp.david-5bf.workers.dev/sse \
            -H "Accept: text/event-stream" \
            -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
      
      - name: Test Fetch Ed Code
        run: |
          curl -f -X POST https://ca-ed-code-mcp.david-5bf.workers.dev/sse \
            -H "Accept: text/event-stream" \
            -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"fetch_ed_code","arguments":{"section":"15278"}}}'
```

## 10. Quick Validation Script

Run this comprehensive test:

```bash
#!/bin/bash
# save as validate-mcp.sh

echo "🧪 Validating CA Ed Code MCP Server..."
echo "=====================================\n"

URL="https://ca-ed-code-mcp.david-5bf.workers.dev/sse"

# Test 1: Basic connectivity
echo "1. Testing basic connectivity..."
if curl -s -f "$URL" > /dev/null 2>&1; then
    echo "❌ Failed: SSE endpoint should require proper headers"
else
    echo "✅ Passed: Endpoint requires proper headers"
fi

# Test 2: Initialize
echo "\n2. Testing initialize method..."
RESPONSE=$(curl -s -X POST "$URL" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
  2>&1 | head -20)

if echo "$RESPONSE" | grep -q "protocolVersion"; then
    echo "✅ Passed: Initialize returned protocol version"
else
    echo "❌ Failed: Initialize didn't return expected response"
fi

# Test 3: List tools
echo "\n3. Testing tools/list method..."
RESPONSE=$(curl -s -X POST "$URL" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  2>&1 | head -20)

if echo "$RESPONSE" | grep -q "fetch_ed_code"; then
    echo "✅ Passed: Tools list includes fetch_ed_code"
else
    echo "❌ Failed: Tools list doesn't include expected tool"
fi

# Test 4: Fetch actual code
echo "\n4. Testing fetch_ed_code tool..."
RESPONSE=$(curl -s -X POST "$URL" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"fetch_ed_code","arguments":{"section":"15278"}}}' \
  2>&1 | head -50)

if echo "$RESPONSE" | grep -q "Citizens.*Oversight.*Committee"; then
    echo "✅ Passed: Successfully fetched Ed Code section 15278"
else
    echo "❌ Failed: Couldn't fetch Ed Code content"
fi

# Test 5: Rate limiting headers
echo "\n5. Testing rate limit headers..."
HEADERS=$(curl -s -I -X POST "$URL" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/list","params":{}}' \
  2>&1)

if echo "$HEADERS" | grep -q "X-RateLimit-Limit"; then
    echo "✅ Passed: Rate limit headers present"
else
    echo "❌ Failed: Rate limit headers missing"
fi

echo "\n🎉 Validation complete!"
```

## Recommended Validation Process

1. **Start with MCP Inspector** - Most comprehensive testing
2. **Set up Better Uptime** - Free continuous monitoring
3. **Create Postman collection** - For regression testing
4. **Add GitHub Action** - Automated CI/CD testing
5. **Use k6 for load testing** - Verify rate limits work

This multi-layered approach ensures your MCP server is working correctly and stays healthy over time.