/**
 * Render PostgreSQL & Redis management tools.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { renderGet, renderPost, renderDelete, handleApiError, truncateIfNeeded } from "../services/api.js";

export function registerDatabaseTools(server: McpServer): void {
  // ─── List PostgreSQL Databases ───────────────────────────────────
  server.registerTool(
    "render_list_postgres",
    {
      title: "List PostgreSQL Databases",
      description: `List all PostgreSQL databases in your Render account.

Args:
  - limit (number): Max results (default 20, max 100)
  - cursor (string, optional): Pagination cursor
  - name (string, optional): Filter by name

Returns: Database list with id, name, status, region, plan, version, connection info.`,
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
        cursor: z.string().optional().describe("Pagination cursor"),
        name: z.string().optional().describe("Filter by database name"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const query: Record<string, unknown> = { limit: params.limit };
        if (params.cursor) query.cursor = params.cursor;
        if (params.name) query.name = params.name;

        const data = await renderGet<Array<{ postgres: Record<string, unknown>; cursor: string }>>(
          "/postgres",
          query
        );
        const dbs = data.map((d) => d.postgres);

        const lines: string[] = [`# PostgreSQL Databases (${dbs.length})\n`];
        for (const db of dbs) {
          lines.push(`## ${db.name} (${db.id})`);
          lines.push(`- **Status**: ${db.status}`);
          lines.push(`- **Region**: ${db.region}`);
          lines.push(`- **Plan**: ${db.plan}`);
          lines.push(`- **Version**: PostgreSQL ${db.version}`);
          lines.push(`- **Created**: ${db.createdAt}`);
          if (db.expiresAt) lines.push(`- **Expires**: ${db.expiresAt}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncateIfNeeded(lines.join("\n")) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Get PostgreSQL Database ─────────────────────────────────────
  server.registerTool(
    "render_get_postgres",
    {
      title: "Get PostgreSQL Database Details",
      description: `Get detailed info about a specific PostgreSQL database, including connection strings.

Args:
  - postgres_id (string): The PostgreSQL database ID (e.g. dpg-abc123)

Returns: Full details including name, status, region, plan, version, connection info (internal/external URLs, connection string), and disk usage.`,
      inputSchema: {
        postgres_id: z.string().min(1).describe("PostgreSQL database ID (e.g. dpg-abc123)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const db = await renderGet<Record<string, unknown>>(`/postgres/${params.postgres_id}`);
        return { content: [{ type: "text", text: JSON.stringify(db, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── List Redis Instances ────────────────────────────────────────
  server.registerTool(
    "render_list_redis",
    {
      title: "List Redis Instances",
      description: `List all Redis instances in your Render account.

Args:
  - limit (number): Max results (default 20, max 100)
  - cursor (string, optional): Pagination cursor

Returns: Redis instances with id, name, status, region, plan, max memory policy.`,
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
        cursor: z.string().optional().describe("Pagination cursor"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const query: Record<string, unknown> = { limit: params.limit };
        if (params.cursor) query.cursor = params.cursor;

        const data = await renderGet<Array<{ redis: Record<string, unknown>; cursor: string }>>(
          "/redis",
          query
        );
        const instances = data.map((d) => d.redis);

        const lines: string[] = [`# Redis Instances (${instances.length})\n`];
        for (const r of instances) {
          lines.push(`## ${r.name} (${r.id})`);
          lines.push(`- **Status**: ${r.status}`);
          lines.push(`- **Region**: ${r.region}`);
          lines.push(`- **Plan**: ${r.plan}`);
          if (r.maxmemoryPolicy) lines.push(`- **Eviction**: ${r.maxmemoryPolicy}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncateIfNeeded(lines.join("\n")) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
