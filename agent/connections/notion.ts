import { connect } from '@vercel/connect/eve';
import { defineMcpClientConnection } from 'eve/connections';
import { once } from 'eve/tools/approval';

// Notion's hosted MCP server (Streamable HTTP). Auth is brokered by the
// Vercel Connect connector `mcp.notion.com/agentbot`, which holds the OAuth
// credentials — the first call that needs Notion surfaces a sign-in challenge.
// `once()` gates the connection behind a single approval per session so the
// agent confirms before reading from or writing to the workspace.
export default defineMcpClientConnection({
  url: 'https://mcp.notion.com/mcp',
  description: 'Notion: search, read, create, and manage pages, databases, wikis, and blocks.',
  auth: connect('mcp.notion.com/agentbot'),
  approval: once(),
});
