#!/bin/bash

# CA Ed Code MCP - Cloudflare Setup Script
# This script helps set up the Cloudflare Workers environment with proper secrets management

set -e

echo "🚀 CA Ed Code MCP - Cloudflare Workers Setup"
echo "==========================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
echo "📝 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please log in to Cloudflare:"
    wrangler login
fi

echo ""
echo "✅ Logged in to Cloudflare"
echo ""

# Create wrangler.toml if it doesn't exist
if [ ! -f "wrangler.toml" ]; then
    echo "📄 Creating wrangler.toml from template..."
    cp wrangler.toml.example wrangler.toml
    echo "✅ Created wrangler.toml"
else
    echo "ℹ️  wrangler.toml already exists"
fi

# Create KV namespaces
echo ""
echo "🗄️  Creating KV namespaces..."
echo ""

# Function to extract KV namespace ID from wrangler output
extract_kv_id() {
    local output="$1"
    echo "$output" | grep -o 'id = "[^"]*"' | cut -d'"' -f2
}

# Create CACHE namespace
echo "Creating CACHE namespace..."
CACHE_OUTPUT=$(wrangler kv:namespace create "CACHE" 2>&1)
CACHE_ID=$(extract_kv_id "$CACHE_OUTPUT")

if [ -z "$CACHE_ID" ]; then
    echo "❌ Failed to create CACHE namespace"
    echo "Output: $CACHE_OUTPUT"
    exit 1
fi

echo "✅ Created CACHE namespace with ID: $CACHE_ID"

# Create RATE_LIMIT namespace
echo "Creating RATE_LIMIT namespace..."
RATE_LIMIT_OUTPUT=$(wrangler kv:namespace create "RATE_LIMIT" 2>&1)
RATE_LIMIT_ID=$(extract_kv_id "$RATE_LIMIT_OUTPUT")

if [ -z "$RATE_LIMIT_ID" ]; then
    echo "❌ Failed to create RATE_LIMIT namespace"
    echo "Output: $RATE_LIMIT_OUTPUT"
    exit 1
fi

echo "✅ Created RATE_LIMIT namespace with ID: $RATE_LIMIT_ID"

# Save namespace IDs to a JSON file (git-ignored)
echo ""
echo "💾 Saving namespace IDs..."
cat > kv-namespaces.json << EOF
{
  "cache_id": "$CACHE_ID",
  "rate_limit_id": "$RATE_LIMIT_ID",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "✅ Saved to kv-namespaces.json"

# Update wrangler.toml with the IDs
echo ""
echo "📝 Updating wrangler.toml with namespace IDs..."

# Create a temporary file with the updated configuration
cat > wrangler.toml.tmp << EOF
name = "ca-ed-code-mcp"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# KV Namespaces - Automatically configured by setup script
[[kv_namespaces]]
binding = "CACHE"
id = "$CACHE_ID"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "$RATE_LIMIT_ID"

[vars]
CACHE_TTL = "86400"
GLOBAL_RATE_LIMIT = "1000"
SECTION_RATE_LIMIT = "10"
RATE_LIMIT_WINDOW = "60"
LOG_LEVEL = "info"

# Development environment
[env.dev]
vars = { LOG_LEVEL = "debug" }

# Production environment
[env.production]
# Routes will be configured during deployment
EOF

# Replace the original file
mv wrangler.toml.tmp wrangler.toml

echo "✅ Updated wrangler.toml"

# Summary
echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Summary:"
echo "  - CACHE namespace ID: $CACHE_ID"
echo "  - RATE_LIMIT namespace ID: $RATE_LIMIT_ID"
echo "  - Configuration saved to: wrangler.toml (git-ignored)"
echo "  - Namespace IDs backed up to: kv-namespaces.json (git-ignored)"
echo ""
echo "🚀 Next steps:"
echo "  1. Run 'npm install' to install dependencies"
echo "  2. Run 'npm run dev' to start local development"
echo "  3. Run 'npm run deploy' to deploy to Cloudflare Workers"
echo ""
echo "⚠️  Remember: Never commit wrangler.toml or kv-namespaces.json to git!"