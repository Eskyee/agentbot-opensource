#!/usr/bin/env node
/**
 * Render MCP Server
 *
 * Provides tools to manage Render cloud infrastructure — services, deploys,
 * PostgreSQL databases, Redis instances, logs, env vars, and custom domains.
 *
 * Auth: Set RENDER_API_KEY env var (get from https://dashboard.render.com/u/settings#api-keys)
 * Transport: stdio (default) or streamable HTTP (set TRANSPORT=http)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerServiceTools } from "./tools/services.js";
import { registerDeployTools } from "./tools/deploys.js";
import { registerDatabaseTools } from "./tools/databases.js";
import { registerLogsAndEnvTools } from "./tools/logs.js";
import { registerProjectTools } from "./tools/projects.js";

// Create MCP server
const server = new McpServer({
  name: "render-mcp-server",
  version: "1.0.0",
});

// Register all tool groups
registerServiceTools(server);
registerDeployTools(server);
registerDatabaseTools(server);
registerLogsAndEnvTools(server);
registerProjectTools(server);

// Start server
async function main(): Promise<void> {
  const apiKey = process.env.RENDER_API_KEY;
  if (!apiKey) {
    console.error(
      "ERROR: RENDER_API_KEY environment variable is required.\n" +
      "Get your API key from: https://dashboard.render.com/u/settings#api-keys"
    );
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Render MCP server running via stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
