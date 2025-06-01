"""MCP server for California Education Code."""

import logging
import os
from typing import Any

from mcp.server import Server
from mcp.types import Tool, TextContent

from .cache import EdCodeCache
from .scraper import EdCodeScraper

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create the MCP server
app = Server("ca-ed-code")

# Initialize components
scraper = EdCodeScraper()
cache = EdCodeCache(
    cache_dir=os.getenv("CA_ED_CODE_CACHE_DIR", ".cache"),
    ttl_seconds=int(os.getenv("CA_ED_CODE_CACHE_TTL", "86400"))
)


@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="fetch_ed_code",
            description="Fetch California Education Code section content by section number",
            inputSchema={
                "type": "object",
                "properties": {
                    "section": {
                        "type": "string",
                        "description": "The Ed Code section number (e.g., '15278', '44237.5')"
                    }
                },
                "required": ["section"]
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls."""
    if name != "fetch_ed_code":
        raise ValueError(f"Unknown tool: {name}")
    
    section = arguments.get("section")
    if not section:
        raise ValueError("Missing required parameter: section")
    
    logger.info(f"Fetching Ed Code section: {section}")
    
    # Check cache first
    result = cache.get(section)
    if result:
        logger.info(f"Cache hit for section {section}")
    else:
        # Fetch from website
        logger.info(f"Cache miss for section {section}, fetching from website")
        result = scraper.fetch_section(section)
        
        # Cache the result if successful
        if result:
            cache.set(section, result)
    
    if not result:
        return [
            TextContent(
                type="text",
                text=f"Error: Could not find California Education Code section {section}. "
                     f"Please verify the section number exists."
            )
        ]
    
    # Format the response
    response_text = f"California Education Code Section {result['section']}\n"
    if result['title'] != f"Education Code Section {result['section']}":
        response_text += f"Title: {result['title']}\n"
    response_text += f"URL: {result['url']}\n\n"
    response_text += result['content']
    
    return [
        TextContent(
            type="text",
            text=response_text
        )
    ]


def main():
    """Run the MCP server."""
    import asyncio
    from mcp.server.stdio import stdio_server
    
    logger.info("Starting CA Ed Code MCP server...")
    
    # Run the server
    asyncio.run(stdio_server(app))


if __name__ == "__main__":
    main()