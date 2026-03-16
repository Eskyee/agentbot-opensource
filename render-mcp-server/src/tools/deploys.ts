/**
 * Render deploy management tools — list, trigger, get details, cancel.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { renderGet, renderPost, handleApiError, truncateIfNeeded } from "../services/api.js";

export function registerDeployTools(server: McpServer): void {
  // ─── List Deploys ────────────────────────────────────────────────
  server.registerTool(
    "render_list_deploys",
    {
      title: "List Deploys for Service",
      description: `List recent deploys for a Render service. Shows commit, status, timing, and trigger info.

Args:
  - service_id (string): The service ID
  - limit (number): Max results (default 10, max 50)
  - cursor (string, optional): Pagination cursor

Returns: Deploy history with id, commit, status (created/build_in_progress/live/deactivated/build_failed/canceled), timestamps, and trigger info.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID"),
        limit: z.number().int().min(1).max(50).default(10).describe("Max deploys to return"),
        cursor: z.string().optional().describe("Pagination cursor"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const query: Record<string, unknown> = { limit: params.limit };
        if (params.cursor) query.cursor = params.cursor;

        const data = await renderGet<Array<{ deploy: Record<string, unknown>; cursor: string }>>(
          `/services/${params.service_id}/deploys`,
          query
        );
        const deploys = data.map((d) => d.deploy);

        const lines: string[] = [`# Recent Deploys — ${params.service_id}\n`];
        for (const d of deploys) {
          const commit = d.commit as Record<string, unknown> | undefined;
          lines.push(`## ${d.id}`);
          lines.push(`- **Status**: ${d.status}`);
          if (commit?.message) lines.push(`- **Commit**: ${String(commit.message).slice(0, 80)}`);
          if (commit?.id) lines.push(`- **SHA**: ${String(commit.id).slice(0, 8)}`);
          if (d.trigger) lines.push(`- **Trigger**: ${d.trigger}`);
          if (d.createdAt) lines.push(`- **Created**: ${d.createdAt}`);
          if (d.finishedAt) lines.push(`- **Finished**: ${d.finishedAt}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncateIfNeeded(lines.join("\n")) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Trigger Deploy ──────────────────────────────────────────────
  server.registerTool(
    "render_trigger_deploy",
    {
      title: "Trigger Deploy",
      description: `Trigger a new deploy for a Render service. Optionally specify a commit hash to deploy.

Args:
  - service_id (string): The service ID to deploy
  - clear_cache (string, optional): "clear" to clear build cache, "do_not_clear" to keep it

Returns: Deploy details with ID and status.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID to deploy"),
        clear_cache: z.enum(["clear", "do_not_clear"]).optional().describe("Whether to clear build cache"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {};
        if (params.clear_cache) body.clearCache = params.clear_cache;

        const deploy = await renderPost<Record<string, unknown>>(
          `/services/${params.service_id}/deploys`,
          body
        );
        return {
          content: [{
            type: "text",
            text: `Deploy triggered for ${params.service_id}.\n\n${JSON.stringify(deploy, null, 2)}`
          }],
        };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Get Deploy ──────────────────────────────────────────────────
  server.registerTool(
    "render_get_deploy",
    {
      title: "Get Deploy Details",
      description: `Get detailed information about a specific deploy.

Args:
  - service_id (string): The service ID
  - deploy_id (string): The deploy ID

Returns: Full deploy details including status, commit, timing, build info.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID"),
        deploy_id: z.string().min(1).describe("Deploy ID"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const deploy = await renderGet<Record<string, unknown>>(
          `/services/${params.service_id}/deploys/${params.deploy_id}`
        );
        return { content: [{ type: "text", text: JSON.stringify(deploy, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Cancel Deploy ───────────────────────────────────────────────
  server.registerTool(
    "render_cancel_deploy",
    {
      title: "Cancel Deploy",
      description: `Cancel a deploy that is currently in progress.

Args:
  - service_id (string): The service ID
  - deploy_id (string): The deploy ID to cancel

Returns: Confirmation.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID"),
        deploy_id: z.string().min(1).describe("Deploy ID to cancel"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        await renderPost(`/services/${params.service_id}/deploys/${params.deploy_id}/cancel`);
        return { content: [{ type: "text", text: `Deploy ${params.deploy_id} cancelled.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
