/**
 * Render logs and environment variable tools.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { renderGet, renderPost, renderPatch, renderDelete, handleApiError, truncateIfNeeded } from "../services/api.js";

export function registerLogsAndEnvTools(server: McpServer): void {
  // ─── Get Service Logs ────────────────────────────────────────────
  server.registerTool(
    "render_get_logs",
    {
      title: "Get Service Logs",
      description: `Retrieve recent logs from a Render service. Useful for debugging deploy failures or runtime errors.

Args:
  - resource_id (string): Service or database ID to get logs for
  - limit (number): Number of log lines (default 100, max 500)
  - direction (string): "forward" or "backward" (default: backward — most recent first)
  - level (string, optional): Filter by log level — debug, info, warn, error

Returns: Log lines with timestamps, level, and message.`,
      inputSchema: {
        resource_id: z.string().min(1).describe("Service or database ID"),
        limit: z.number().int().min(1).max(500).default(100).describe("Number of log lines"),
        direction: z.enum(["forward", "backward"]).default("backward").describe("Log order"),
        level: z.enum(["debug", "info", "warn", "error"]).optional().describe("Filter by log level"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const query: Record<string, unknown> = {
          limit: params.limit,
          direction: params.direction,
          resource: [params.resource_id],
        };
        if (params.level) query.level = [params.level];

        const data = await renderGet<Array<{ id: string; timestamp: string; level: string; message: string }>>(
          "/logs",
          query
        );

        if (!data || data.length === 0) {
          return { content: [{ type: "text", text: "No logs found for this resource." }] };
        }

        const lines: string[] = [`# Logs — ${params.resource_id} (${data.length} lines)\n`];
        for (const log of data) {
          const ts = log.timestamp ? new Date(log.timestamp).toISOString() : "";
          const level = (log.level || "info").toUpperCase().padEnd(5);
          lines.push(`[${ts}] ${level} ${log.message}`);
        }

        return { content: [{ type: "text", text: truncateIfNeeded(lines.join("\n")) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── List Environment Variables ──────────────────────────────────
  server.registerTool(
    "render_list_env_vars",
    {
      title: "List Environment Variables",
      description: `List environment variables for a Render service. Sensitive values are masked.

Args:
  - service_id (string): The service ID

Returns: List of env vars with key and value (sensitive values shown as ***).`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await renderGet<Array<{ envVar: Record<string, unknown> }>>(
          `/services/${params.service_id}/env-vars`
        );
        const vars = data.map((d) => d.envVar);

        const lines: string[] = [`# Environment Variables — ${params.service_id}\n`];
        for (const v of vars) {
          const val = v.value as string;
          // Mask potentially sensitive values
          const masked = val && val.length > 8 ? val.slice(0, 4) + "***" : "***";
          lines.push(`- **${v.key}**: \`${masked}\``);
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Set Environment Variable ────────────────────────────────────
  server.registerTool(
    "render_set_env_var",
    {
      title: "Set Environment Variable",
      description: `Create or update an environment variable on a Render service. This will trigger a redeploy.

Args:
  - service_id (string): The service ID
  - key (string): Environment variable name (e.g. DATABASE_URL)
  - value (string): Environment variable value

Returns: Confirmation.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID"),
        key: z.string().min(1).max(256).describe("Env var name"),
        value: z.string().describe("Env var value"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        await renderPost(`/services/${params.service_id}/env-vars`, [
          { key: params.key, value: params.value },
        ]);
        return { content: [{ type: "text", text: `Environment variable ${params.key} set on ${params.service_id}. A redeploy will be triggered.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Delete Environment Variable ─────────────────────────────────
  server.registerTool(
    "render_delete_env_var",
    {
      title: "Delete Environment Variable",
      description: `Remove an environment variable from a Render service.

Args:
  - service_id (string): The service ID
  - key (string): The env var key to remove

Returns: Confirmation.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID"),
        key: z.string().min(1).describe("Env var key to delete"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        await renderDelete(`/services/${params.service_id}/env-vars/${params.key}`);
        return { content: [{ type: "text", text: `Environment variable ${params.key} deleted from ${params.service_id}.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Get Custom Domains ──────────────────────────────────────────
  server.registerTool(
    "render_list_custom_domains",
    {
      title: "List Custom Domains",
      description: `List custom domains attached to a Render service.

Args:
  - service_id (string): The service ID

Returns: Domains with name, verification status, and DNS configuration.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await renderGet<Array<{ customDomain: Record<string, unknown> }>>(
          `/services/${params.service_id}/custom-domains`
        );
        const domains = data.map((d) => d.customDomain);

        if (domains.length === 0) {
          return { content: [{ type: "text", text: "No custom domains configured." }] };
        }

        const lines: string[] = [`# Custom Domains — ${params.service_id}\n`];
        for (const d of domains) {
          lines.push(`## ${d.name}`);
          lines.push(`- **Verified**: ${d.verificationStatus}`);
          if (d.domainType) lines.push(`- **Type**: ${d.domainType}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
