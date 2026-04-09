# Mintlify MCP Integration

## Overview
Integrates with the Mint Starter Kit MCP server to search and retrieve documentation.

## MCP Server
- **URL:** https://raveculture.mintlify.app/mcp
- **Transport:** HTTP

## Tools

### search_docs
Search across the Mint Starter Kit knowledge base.

```json
{
  "query": "search query"
}
```

## Usage

```typescript
// Search documentation
const result = await fetch('https://raveculture.mintlify.app/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'search_mint_starter_kit',
      arguments: { query: 'your question' }
    }
  })
});
```

## Environment
- MCP_SERVER_URL=https://raveculture.mintlify.app/mcp
