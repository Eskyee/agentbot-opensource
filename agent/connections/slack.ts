import { connect } from '@vercel/connect/eve';
import { defineMcpClientConnection } from 'eve/connections';
import { once } from 'eve/tools/approval';

// Slack's official hosted MCP server (Streamable HTTP). Auth is brokered by a
// Vercel Connect connector; create one for Slack in the Vercel dashboard (same
// flow as the Notion connector) and make its slug match the value passed to
// connect() below. Requires a registered Slack app behind the connector.
// Replaces the former send_slack_message stub, which returned a fake timestamp.
export default defineMcpClientConnection({
  url: 'https://mcp.slack.com/mcp',
  description: 'Slack: search, send messages, channels, canvases, and users.',
  auth: connect('slack/slack-agentbot'),
  approval: once(),
})
