#!/bin/bash

# Pre-commit hook to prevent committing secrets
# Install by running: cp scripts/pre-commit.sh ../.git/hooks/pre-commit

echo "🔍 Checking for secrets..."

# Check if wrangler.toml is being committed
if git diff --cached --name-only | grep -q "^cloudflare/wrangler\.toml$"; then
    echo "❌ ERROR: Attempting to commit wrangler.toml"
    echo "   This file contains KV namespace IDs and should not be committed."
    echo "   Use 'git reset HEAD cloudflare/wrangler.toml' to unstage it."
    exit 1
fi

# Check for KV namespace patterns in staged files
if git diff --cached | grep -E "[a-f0-9]{32}"; then
    echo "⚠️  WARNING: Possible KV namespace ID detected in staged changes."
    echo "   Please review your changes to ensure no secrets are being committed."
    echo ""
    echo "   Found patterns that look like KV IDs:"
    git diff --cached | grep -E "[a-f0-9]{32}" | head -5
    echo ""
    read -p "   Are you sure you want to continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for common secret patterns
PATTERNS=(
    "api[_-]?key"
    "api[_-]?secret"
    "auth[_-]?token"
    "private[_-]?key"
    "client[_-]?secret"
)

for pattern in "${PATTERNS[@]}"; do
    if git diff --cached | grep -i "$pattern"; then
        echo "⚠️  WARNING: Possible secret detected (pattern: $pattern)"
        echo "   Please review your changes carefully."
        read -p "   Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
done

# Check for .env files
if git diff --cached --name-only | grep -E "\.env(\.|$)"; then
    echo "❌ ERROR: Attempting to commit .env file"
    echo "   Environment files should never be committed."
    exit 1
fi

echo "✅ No obvious secrets detected."
echo "   Remember: Always review your changes before committing!"