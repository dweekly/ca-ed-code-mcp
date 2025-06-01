# Local Deployment Guide for CA Ed Code MCP Server

This guide walks you through deploying the CA Ed Code MCP server locally for use with Claude Desktop.

## Prerequisites

- Python 3.11 or higher
- Git
- Claude Desktop application

## Step 1: Clone the Repository

```bash
git clone https://github.com/dweekly/ca-ed-code-mcp.git
cd ca-ed-code-mcp
```

## Step 2: Set Up Python Environment

### Option A: Using venv (Recommended)

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Option B: Using pip directly

```bash
pip install -r requirements.txt
```

## Step 3: Test the Server

Before configuring Claude Desktop, verify the server works:

```bash
# Run the server directly
python -m ca_ed_code_mcp

# You should see:
# INFO:ca_ed_code_mcp.server:Starting CA Ed Code MCP server...
# The server will wait for input - press Ctrl+C to exit
```

## Step 4: Configure Claude Desktop

1. Open Claude Desktop
2. Go to Settings → Developer → MCP Servers
3. Click "Add Server" or "Edit Config"
4. Add the following configuration:

### macOS/Linux Configuration

```json
{
  "mcpServers": {
    "ca-ed-code": {
      "command": "python",
      "args": ["-m", "ca_ed_code_mcp"],
      "cwd": "/path/to/ca-ed-code-mcp",
      "env": {
        "CA_ED_CODE_CACHE_DIR": "/path/to/ca-ed-code-mcp/.cache",
        "CA_ED_CODE_CACHE_TTL": "86400"
      }
    }
  }
}
```

### Windows Configuration

```json
{
  "mcpServers": {
    "ca-ed-code": {
      "command": "python",
      "args": ["-m", "ca_ed_code_mcp"],
      "cwd": "C:\\path\\to\\ca-ed-code-mcp",
      "env": {
        "CA_ED_CODE_CACHE_DIR": "C:\\path\\to\\ca-ed-code-mcp\\.cache",
        "CA_ED_CODE_CACHE_TTL": "86400"
      }
    }
  }
}
```

### Using Virtual Environment

If you're using a virtual environment, point to the Python executable inside it:

**macOS/Linux:**
```json
{
  "mcpServers": {
    "ca-ed-code": {
      "command": "/path/to/ca-ed-code-mcp/venv/bin/python",
      "args": ["-m", "ca_ed_code_mcp"],
      "cwd": "/path/to/ca-ed-code-mcp"
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "ca-ed-code": {
      "command": "C:\\path\\to\\ca-ed-code-mcp\\venv\\Scripts\\python.exe",
      "args": ["-m", "ca_ed_code_mcp"],
      "cwd": "C:\\path\\to\\ca-ed-code-mcp"
    }
  }
}
```

## Step 5: Restart Claude Desktop

After saving the configuration:
1. Quit Claude Desktop completely
2. Restart Claude Desktop
3. The CA Ed Code MCP server should now be available

## Step 6: Test in Claude

In a new Claude conversation, try:

```
Can you fetch California Education Code section 15278?
```

Claude should use the `fetch_ed_code` tool to retrieve the content.

## Environment Variables (Optional)

You can customize the server behavior with these environment variables:

- `CA_ED_CODE_CACHE_DIR`: Directory for cache files (default: `.cache`)
- `CA_ED_CODE_CACHE_TTL`: Cache time-to-live in seconds (default: 86400 = 24 hours)
- `CA_ED_CODE_TIMEOUT`: Request timeout in seconds (default: 30)

## Troubleshooting

### Server doesn't appear in Claude

1. Check the configuration JSON syntax
2. Verify the file paths are absolute, not relative
3. Ensure Python is in your PATH or use full path to Python executable
4. Check Claude Desktop logs for errors

### "Module not found" errors

1. Make sure you're in the correct directory
2. Verify dependencies are installed: `pip list | grep mcp`
3. If using venv, ensure it's activated or use the venv Python path

### Permission errors

1. Ensure the cache directory is writable
2. On macOS, you may need to grant Terminal/Python file access permissions

### Cache issues

Clear the cache:
```bash
rm -rf .cache/edc_*.json
```

## Updating the Server

To update to the latest version:

```bash
cd /path/to/ca-ed-code-mcp
git pull
pip install -r requirements.txt --upgrade
```

Then restart Claude Desktop to load the updated server.

## Notes

- The server runs on-demand when Claude needs it
- Cache files are stored locally to minimize requests to the CA website
- The server only has access to fetch CA Ed Code sections, no other system access
- Logs are available in Claude Desktop's developer console

## Next Steps

Once you have the server running locally, you might want to:
- Modify the cache TTL for your needs
- Add additional California codes (Health & Safety, etc.)
- Set up remote hosting for team access