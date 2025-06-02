# Structured Response Examples

The CA Ed Code MCP server now returns structured responses with separate fields for metadata.

## Response Structure

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "The actual Ed Code section text (without section number prefix)..."
      }
    ],
    "section": "15278",
    "title": "ARTICLE 2. Citizens' Oversight Committee",
    "url": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=15278.&lawCode=EDC",
    "fetchedAt": "2025-06-02T01:27:21.961Z"  // ISO timestamp when fetched from CA website
  }
}
```

## Accessing Fields with jq

### Get just the section text:
```bash
curl -s -X POST https://ca-ed-code-mcp.david-5bf.workers.dev/sse \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fetch_ed_code","arguments":{"section":"15278"}}}' | \
  sed 's/^data: //' | jq -r '.result.content[0].text'
```

### Get just the title:
```bash
curl -s -X POST https://ca-ed-code-mcp.david-5bf.workers.dev/sse \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fetch_ed_code","arguments":{"section":"15278"}}}' | \
  sed 's/^data: //' | jq -r '.result.title'
```

### Get the URL:
```bash
curl -s -X POST https://ca-ed-code-mcp.david-5bf.workers.dev/sse \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fetch_ed_code","arguments":{"section":"15278"}}}' | \
  sed 's/^data: //' | jq -r '.result.url'
```

### Check when it was fetched:
```bash
curl -s -X POST https://ca-ed-code-mcp.david-5bf.workers.dev/sse \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fetch_ed_code","arguments":{"section":"15278"}}}' | \
  sed 's/^data: //' | jq -r '.result.fetchedAt'
```

### Create a formatted citation:
```bash
# Get the response
RESPONSE=$(curl -s -X POST https://ca-ed-code-mcp.david-5bf.workers.dev/sse \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fetch_ed_code","arguments":{"section":"15278"}}}' | \
  sed 's/^data: //')

# Extract fields
SECTION=$(echo "$RESPONSE" | jq -r '.result.section')
TITLE=$(echo "$RESPONSE" | jq -r '.result.title')
URL=$(echo "$RESPONSE" | jq -r '.result.url')

# Format citation
echo "California Education Code § $SECTION"
echo "$TITLE"
echo "Available at: $URL"
```

## JavaScript Example

```javascript
// Fetch Ed Code section
const response = await fetch('https://ca-ed-code-mcp.david-5bf.workers.dev/sse', {
  method: 'POST',
  headers: {
    'Accept': 'text/event-stream',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'fetch_ed_code',
      arguments: { section: '15278' }
    }
  })
});

const data = await response.text();
const result = JSON.parse(data.replace('data: ', ''));

// Access structured fields
console.log('Section:', result.result.section);
console.log('Title:', result.result.title);
console.log('URL:', result.result.url);
console.log('Content:', result.result.content[0].text);
```

## Python Example

```python
import requests
import json

# Make request
response = requests.post(
    'https://ca-ed-code-mcp.david-5bf.workers.dev/sse',
    headers={
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json'
    },
    json={
        'jsonrpc': '2.0',
        'id': 1,
        'method': 'tools/call',
        'params': {
            'name': 'fetch_ed_code',
            'arguments': {'section': '15278'}
        }
    }
)

# Parse SSE response
data = response.text.replace('data: ', '')
result = json.loads(data)

# Access fields
print(f"Section: {result['result']['section']}")
print(f"Title: {result['result']['title']}")
print(f"URL: {result['result']['url']}")
print(f"Content: {result['result']['content'][0]['text'][:200]}...")
```

## Benefits of Structured Response

1. **Easier parsing** - No need to extract metadata from text
2. **Direct access** - Get URL or title without parsing
3. **Better for automation** - Build citations, links, or indexes
4. **Cleaner integration** - MCP clients can use metadata directly