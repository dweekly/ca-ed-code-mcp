# Secrets Management Guide

This guide explains how to properly manage secrets and sensitive configuration for the CA Ed Code MCP Cloudflare Workers deployment.

## Overview

This project uses several strategies to prevent accidental exposure of secrets:

1. **Git-ignored configuration files** - Local configs never get committed
2. **Template files** - Examples show structure without real values  
3. **Automated setup script** - Generates configs with proper values
4. **Environment-specific secrets** - Different values for dev/staging/prod

## Quick Start

Run the setup script to automatically configure your environment:

```bash
cd cloudflare
./scripts/setup.sh
```

This will:
- Create KV namespaces in your Cloudflare account
- Generate a properly configured `wrangler.toml` (git-ignored)
- Save namespace IDs to `kv-namespaces.json` (git-ignored)

## Configuration Files

### Files That Should NEVER Be Committed

- `wrangler.toml` - Contains KV namespace IDs
- `kv-namespaces.json` - Backup of namespace IDs
- `.env` - Environment variables
- `.dev.vars` - Wrangler dev variables
- Any file in `.secrets/` directory

### Safe Template Files

- `wrangler.toml.example` - Template with placeholders
- `.env.example` - Environment variable template

## Manual Configuration

If you prefer to configure manually:

1. Copy the template:
   ```bash
   cp wrangler.toml.example wrangler.toml
   ```

2. Create KV namespaces:
   ```bash
   wrangler kv namespace create CACHE
   wrangler kv namespace create RATE_LIMIT
   ```

3. Update `wrangler.toml` with the IDs from step 2

4. Never commit the updated `wrangler.toml`!

## Adding New Secrets

For API keys or other secrets:

1. **For local development**, use `.dev.vars`:
   ```
   SECRET_API_KEY=your_key_here
   ```

2. **For production**, use Wrangler secrets:
   ```bash
   wrangler secret put SECRET_API_KEY
   ```

3. Access in code:
   ```typescript
   interface Env {
     SECRET_API_KEY: string;
     // ... other env vars
   }
   ```

## Environment-Specific Configuration

### Development
- Uses `.dev.vars` for local secrets
- Can use separate KV namespaces
- Debug logging enabled

### Production
- Uses Wrangler secrets for sensitive values
- Production KV namespaces
- Minimal logging

## CI/CD Secrets

For GitHub Actions deployment:

1. Add secrets to GitHub repository settings:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CACHE_KV_ID`
   - `RATE_LIMIT_KV_ID`

2. Use in workflow:
   ```yaml
   - name: Deploy to Cloudflare
     env:
       CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
   ```

## Rotating Secrets

To rotate KV namespace IDs:

1. Create new namespaces:
   ```bash
   wrangler kv namespace create CACHE_NEW
   ```

2. Update `wrangler.toml` with new IDs

3. Deploy and verify

4. Delete old namespaces:
   ```bash
   wrangler kv namespace delete --namespace-id=OLD_ID
   ```

## Security Checklist

Before committing:

- [ ] Check `git status` - no sensitive files staged
- [ ] Review changes - no hardcoded IDs or keys
- [ ] Verify `.gitignore` includes all secret files
- [ ] Run `git diff` - no secrets in code changes

## Recovery

If you lose your namespace IDs:

1. Check `kv-namespaces.json` (if available)
2. List namespaces in Cloudflare dashboard
3. Use Wrangler to list:
   ```bash
   wrangler kv namespace list
   ```

## Best Practices

1. **Use the setup script** - Automates proper configuration
2. **Keep templates updated** - When adding new config options
3. **Document all secrets** - What they're for, where they're used
4. **Rotate regularly** - Especially after team changes
5. **Use least privilege** - Only grant necessary permissions

## Troubleshooting

### "KV namespace not found"
- Run setup script again
- Verify namespace IDs in wrangler.toml
- Check you're using correct environment

### "Unauthorized" errors
- Verify Cloudflare API token permissions
- Check account ID is correct
- Ensure you're logged in: `wrangler whoami`

### Can't find namespace IDs
- Check `kv-namespaces.json`
- Use `wrangler kv:namespace list`
- Check Cloudflare dashboard

## Emergency Response

If secrets are accidentally committed:

1. **Immediately** rotate all affected secrets
2. Delete the commit (if not pushed)
3. Use `git filter-branch` or BFG to remove from history
4. Notify team members
5. Audit for any unauthorized access

Remember: It's better to be overly cautious with secrets management!