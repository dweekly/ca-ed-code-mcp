# CA Ed Code MCP Server

A Model Context Protocol (MCP) server that provides access to California Education Code sections by fetching content from the official California Legislative Information website.

## Overview

This MCP server enables AI models to retrieve California Education Code sections on-demand. Simply provide an Ed Code section number (e.g., "15278"), and the server will fetch and return the full text along with the source URL.

## Features

- 🔍 Fetch any California Education Code section by number
- 🔗 Includes direct links to the official source
- 💾 Intelligent caching to minimize requests to the state website
- 🛡️ Robust error handling for invalid sections or network issues
- 🚀 Fast response times with built-in caching

## Installation

See [LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md) for detailed setup instructions with Claude Desktop.

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/dweekly/ca-ed-code-mcp.git
cd ca-ed-code-mcp
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure in Claude Desktop (see [LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md) for details)

## Deployment Options

### 1. Cloudflare Workers (Remote) - LIVE! 🚀

The server is publicly available at:
```
https://ca-ed-code-mcp.david-5bf.workers.dev/sse
```

Add to Claude Desktop:
```json
{
  "mcpServers": {
    "ca-ed-code": {
      "transport": "sse",
      "url": "https://ca-ed-code-mcp.david-5bf.workers.dev/sse"
    }
  }
}
```

### 2. Local Deployment

See [LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md) for running your own instance.

## Usage

### With Claude Desktop

1. Add the server configuration (see above)
2. Restart Claude Desktop
3. Ask Claude: "Can you fetch California Education Code section 15278?"

### API Examples

Fetch Ed Code section:
```bash
curl -X POST https://ca-ed-code-mcp.david-5bf.workers.dev/sse \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fetch_ed_code","arguments":{"section":"15278"}}}'
```

### Starting the Server (Local)

```bash
python -m ca_ed_code_mcp.server
```

### MCP Configuration

Add this server to your MCP client configuration:

```json
{
  "mcpServers": {
    "ca-ed-code": {
      "command": "python",
      "args": ["-m", "ca_ed_code_mcp.server"],
      "cwd": "/path/to/ca-ed-code-mcp"
    }
  }
}
```

### Available Tools

#### `fetch_ed_code`

Fetches a California Education Code section.

**Parameters:**
- `section` (string, required): The Ed Code section number (e.g., "15278", "44237.5")

**Returns:**
```json
{
  "section": "15278",
  "title": "Optional section title",
  "content": "Full text of the education code section...",
  "url": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=15278.&lawCode=EDC"
}
```

**Example:**
```
User: What does CA Ed Code 15278 say?
Assistant: I'll fetch California Education Code section 15278 for you.

[Calls fetch_ed_code with section="15278"]

Section 15278 states: [content of the section]...
```

## Development

### Setting Up Development Environment

1. Install development dependencies:
```bash
pip install -r requirements-dev.txt
```

2. Install pre-commit hooks:
```bash
pre-commit install
```

3. Run tests:
```bash
pytest
```

4. Run linting:
```bash
ruff check .
```

### Project Structure

```
ca-ed-code-mcp/
├── src/
│   └── ca_ed_code_mcp/
│       ├── __init__.py
│       ├── server.py      # MCP server implementation
│       ├── scraper.py     # Web scraping logic
│       └── cache.py       # Caching layer
├── tests/                 # Test suite
├── .gitignore
├── pyproject.toml        # Project configuration
├── requirements.txt      # Production dependencies
├── requirements-dev.txt  # Development dependencies
├── README.md            # This file
├── AGENTS.md           # Development process documentation
└── TODO.md             # Task tracking
```

### Testing

Run the test suite:
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=ca_ed_code_mcp

# Run specific test file
pytest tests/test_scraper.py
```

### Contributing

1. Check TODO.md for pending tasks
2. Create a feature branch
3. Make your changes
4. Ensure tests pass and code is linted
5. Submit a pull request

## Configuration

Environment variables (optional):

- `CA_ED_CODE_CACHE_DIR`: Cache directory path (default: `.cache`)
- `CA_ED_CODE_CACHE_TTL`: Cache TTL in seconds (default: 86400)
- `CA_ED_CODE_TIMEOUT`: Request timeout in seconds (default: 30)
- `CA_ED_CODE_DEBUG`: Enable debug logging (default: false)

## Troubleshooting

### Common Issues

1. **SSL Certificate Errors**
   - The CA legislature website may have certificate issues
   - Set `CA_ED_CODE_VERIFY_SSL=false` (not recommended for production)

2. **Rate Limiting**
   - The server implements automatic retry with exponential backoff
   - Cached responses are used when available

3. **Invalid Section Numbers**
   - The server returns clear error messages for non-existent sections
   - Check the official website for valid section numbers

### Debug Mode

Enable debug logging:
```bash
CA_ED_CODE_DEBUG=true python -m ca_ed_code_mcp.server
```

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Built using the [Model Context Protocol](https://modelcontextprotocol.io/)
- Data sourced from [California Legislative Information](https://leginfo.legislature.ca.gov/)

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/dweekly/ca-ed-code-mcp/issues).