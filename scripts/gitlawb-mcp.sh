#!/bin/bash
# Gitlawb MCP Server Runner for Agentbot

# Load keys from vault
export GITLAWB_KEY_PATH="/Users/raveculture/Documents/GitHub/agentbot/web/.vault/keys/gitlawb-identity.pem"
export GITLAWB_NODE="https://node.gitlawb.com"

# Start MCP server
gl mcp serve --node "$GITLAWB_NODE" --dir ~/.gitlawb