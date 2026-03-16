/**
 * Render service management tools — list, get, create, update, restart, scale.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { renderGet, renderPost, renderPatch, renderDelete, handleApiError, truncateIfNeeded } from "../services/api.js";

// Render service types
const SERVICE_TYPES = ["web_service", "private_service", "background_worker", "static_site", "cron_job"] as const;

export function registerServiceTools(server: McpServer): void {
  // ─── List Services ───────────────────────────────────────────────
  server.registerTool(
    "render_list_services",
    {
      title: "List Render Services",
      description: `List all services in your Render account. Supports filtering by name, type, region, and environment.

Args:
  - name (string, optional): Filter by service name (partial match)
  - type (string, optional): Filter by type — web_service, private_service, background_worker, static_site, cron_job
  - region (string, optional): Filter by region — oregon, frankfurt, ohio, singapore, virginia
  - env (string, optional): Filter by environment — docker, node, python, go, rust, ruby, elixir
  - limit (number): Max results (default 20, max 100)
  - cursor (string, optional): Pagination cursor from previous response

Returns: Array of services with id, name, type, status, region, branch, repo, URL, and creation date.`,
      inputSchema: {
        name: z.string().optional().describe("Filter services by name (partial match)"),
        type: z.enum(SERVICE_TYPES).optional().describe("Filter by service type"),
        region: z.string().optional().describe("Filter by region (e.g. oregon, frankfurt)"),
        env: z.string().optional().describe("Filter by runtime environment (e.g. docker, node)"),
        limit: z.number().int().min(1).max(100).default(20).describe("Max results to return"),
        cursor: z.string().optional().describe("Pagination cursor from previous response"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const query: Record<string, unknown> = { limit: params.limit };
        if (params.name) query.name = params.name;
        if (params.type) query.type = params.type;
        if (params.region) query.region = params.region;
        if (params.env) query.env = params.env;
        if (params.cursor) query.cursor = params.cursor;

        const data = await renderGet<Array<{ service: Record<string, unknown>; cursor: string }>>("/services", query);
        const services = data.map((item) => item.service);
        const lastCursor = data.length > 0 ? data[data.length - 1].cursor : undefined;

        const lines: string[] = [`# Render Services (${services.length} results)\n`];
        for (const svc of services) {
          const details = svc.serviceDetails as Record<string, unknown> | undefined;
          lines.push(`## ${svc.name} (${svc.id})`);
          lines.push(`- **Type**: ${svc.type}`);
          lines.push(`- **Status**: ${details?.suspended === "suspended" ? "suspended" : "active"}`);
          lines.push(`- **Region**: ${details?.region ?? "unknown"}`);
          if (details?.url) lines.push(`- **URL**: ${details.url}`);
          if (svc.repo) lines.push(`- **Repo**: ${svc.repo}`);
          if (details?.branch) lines.push(`- **Branch**: ${details.branch}`);
          lines.push("");
        }
        if (lastCursor && services.length >= params.limit) {
          lines.push(`\n> More results available. Use cursor: \`${lastCursor}\``);
        }

        return { content: [{ type: "text", text: truncateIfNeeded(lines.join("\n")) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Get Service ─────────────────────────────────────────────────
  server.registerTool(
    "render_get_service",
    {
      title: "Get Render Service Details",
      description: `Get detailed information about a specific Render service by ID.

Args:
  - service_id (string): The service ID (e.g. srv-abc123)

Returns: Full service details including name, type, region, URL, repo, branch, environment variables, scaling config, auto-deploy status, and more.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID (e.g. srv-abc123)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const svc = await renderGet<Record<string, unknown>>(`/services/${params.service_id}`);
        return { content: [{ type: "text", text: truncateIfNeeded(JSON.stringify(svc, null, 2)) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Restart Service ─────────────────────────────────────────────
  server.registerTool(
    "render_restart_service",
    {
      title: "Restart Render Service",
      description: `Restart a running Render service. This triggers a graceful restart without a new deploy.

Args:
  - service_id (string): The service ID to restart

Returns: Confirmation of restart.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID to restart"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        await renderPost(`/services/${params.service_id}/restart`);
        return { content: [{ type: "text", text: `Service ${params.service_id} restart initiated.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Scale Service ───────────────────────────────────────────────
  server.registerTool(
    "render_scale_service",
    {
      title: "Scale Render Service",
      description: `Scale a Render service up or down by changing the number of instances.

Args:
  - service_id (string): The service ID to scale
  - num_instances (number): Target number of instances (1-50)

Returns: Updated scaling configuration.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID to scale"),
        num_instances: z.number().int().min(1).max(50).describe("Target number of instances"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const result = await renderPost<Record<string, unknown>>(
          `/services/${params.service_id}/scale`,
          { numInstances: params.num_instances }
        );
        return { content: [{ type: "text", text: `Scaled ${params.service_id} to ${params.num_instances} instance(s).\n\n${JSON.stringify(result, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Suspend / Resume ────────────────────────────────────────────
  server.registerTool(
    "render_suspend_service",
    {
      title: "Suspend Render Service",
      description: `Suspend a running Render service. This stops the service and releases compute resources. You can resume it later.

Args:
  - service_id (string): The service ID to suspend

Returns: Confirmation.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID to suspend"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        await renderPost(`/services/${params.service_id}/suspend`);
        return { content: [{ type: "text", text: `Service ${params.service_id} suspended.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "render_resume_service",
    {
      title: "Resume Render Service",
      description: `Resume a previously suspended Render service.

Args:
  - service_id (string): The service ID to resume

Returns: Confirmation.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID to resume"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        await renderPost(`/services/${params.service_id}/resume`);
        return { content: [{ type: "text", text: `Service ${params.service_id} resumed.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Update Service ──────────────────────────────────────────────
  server.registerTool(
    "render_update_service",
    {
      title: "Update Render Service",
      description: `Update a Render service's configuration (name, branch, auto-deploy, instance type, etc.).

Args:
  - service_id (string): The service ID to update
  - name (string, optional): New service name
  - branch (string, optional): Git branch to deploy from
  - auto_deploy (string, optional): "yes" or "no" — whether pushes auto-deploy
  - instance_type (string, optional): Plan type (e.g. starter, standard, pro)

Returns: Updated service configuration.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID to update"),
        name: z.string().optional().describe("New service name"),
        branch: z.string().optional().describe("Git branch to deploy from"),
        auto_deploy: z.enum(["yes", "no"]).optional().describe("Auto-deploy on push"),
        instance_type: z.string().optional().describe("Instance plan (e.g. starter, standard, pro)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {};
        if (params.name) body.name = params.name;
        if (params.branch) body.branch = params.branch;
        if (params.auto_deploy) body.autoDeploy = params.auto_deploy;
        if (params.instance_type) {
          body.serviceDetails = { plan: params.instance_type };
        }
        const result = await renderPatch<Record<string, unknown>>(`/services/${params.service_id}`, body);
        return { content: [{ type: "text", text: `Service updated.\n\n${JSON.stringify(result, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Delete Service ──────────────────────────────────────────────
  server.registerTool(
    "render_delete_service",
    {
      title: "Delete Render Service",
      description: `Permanently delete a Render service. This cannot be undone.

Args:
  - service_id (string): The service ID to delete

Returns: Confirmation of deletion.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Render service ID to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        await renderDelete(`/services/${params.service_id}`);
        return { content: [{ type: "text", text: `Service ${params.service_id} permanently deleted.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
