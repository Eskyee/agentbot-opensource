/**
 * Render Projects, Environments, and Environment Groups tools.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { renderGet, renderPost, renderPatch, renderDelete, handleApiError, truncateIfNeeded } from "../services/api.js";

export function registerProjectTools(server: McpServer): void {
  // ─── List Projects ───────────────────────────────────────────────
  server.registerTool(
    "render_list_projects",
    {
      title: "List Render Projects",
      description: `List all projects in your Render account. Projects organize services and environments.

Args:
  - name (string, optional): Filter by project name
  - limit (number): Max results (default 20, max 100)
  - cursor (string, optional): Pagination cursor

Returns: Projects with id, name, environments count, created date.`,
      inputSchema: {
        name: z.string().optional().describe("Filter by project name"),
        limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
        cursor: z.string().optional().describe("Pagination cursor"),
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
        if (params.cursor) query.cursor = params.cursor;

        const data = await renderGet<Array<{ project: Record<string, unknown>; cursor: string }>>(
          "/projects",
          query
        );
        const projects = data.map((d) => d.project);

        const lines: string[] = [`# Render Projects (${projects.length})\n`];
        for (const p of projects) {
          lines.push(`## ${p.name} (${p.id})`);
          lines.push(`- **Created**: ${p.createdAt}`);
          if (p.environments) lines.push(`- **Environments**: ${(p.environments as unknown[]).length}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncateIfNeeded(lines.join("\n")) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Get Project ─────────────────────────────────────────────────
  server.registerTool(
    "render_get_project",
    {
      title: "Get Render Project Details",
      description: `Get detailed information about a specific project.

Args:
  - project_id (string): The project ID (e.g. prj_abc123)

Returns: Full project details including environments, services.`,
      inputSchema: {
        project_id: z.string().min(1).describe("Project ID (e.g. prj_abc123)"),
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
        const project = await renderGet<Record<string, unknown>>(`/projects/${params.project_id}`);
        return { content: [{ type: "text", text: JSON.stringify(project, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── List Environments ────────────────────────────────────────────
  server.registerTool(
    "render_list_environments",
    {
      title: "List Render Environments",
      description: `List environments in a project.

Args:
  - project_id (string): The project ID
  - limit (number): Max results (default 20, max 100)
  - cursor (string, optional): Pagination cursor

Returns: Environments with id, name, isProduction, services count.`,
      inputSchema: {
        project_id: z.string().min(1).describe("Project ID"),
        limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
        cursor: z.string().optional().describe("Pagination cursor"),
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
        if (params.cursor) query.cursor = params.cursor;

        const data = await renderGet<Array<{ environment: Record<string, unknown>; cursor: string }>>(
          `/projects/${params.project_id}/environments`,
          query
        );
        const envs = data.map((d) => d.environment);

        const lines: string[] = [`# Environments — ${params.project_id} (${envs.length})\n`];
        for (const e of envs) {
          lines.push(`## ${e.name} (${e.id})`);
          lines.push(`- **Production**: ${e.isProduction}`);
          if (e.services) lines.push(`- **Services**: ${(e.services as unknown[]).length}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncateIfNeeded(lines.join("\n")) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Get Environment ─────────────────────────────────────────────
  server.registerTool(
    "render_get_environment",
    {
      title: "Get Render Environment Details",
      description: `Get details about a specific environment.

Args:
  - environment_id (string): The environment ID (e.g. env_abc123)

Returns: Full environment details including services, env vars.`,
      inputSchema: {
        environment_id: z.string().min(1).describe("Environment ID (e.g. env_abc123)"),
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
        const env = await renderGet<Record<string, unknown>>(`/environments/${params.environment_id}`);
        return { content: [{ type: "text", text: JSON.stringify(env, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── List Instances ───────────────────────────────────────────────
  server.registerTool(
    "render_list_instances",
    {
      title: "List Render Instances",
      description: `List all instances for a service.

Args:
  - service_id (string): The service ID
  - limit (number): Max results (default 20, max 100)
  - cursor (string, optional): Pagination cursor

Returns: Instances with id, status, created at, region.`,
      inputSchema: {
        service_id: z.string().min(1).describe("Service ID (e.g. srv-abc123)"),
        limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
        cursor: z.string().optional().describe("Pagination cursor"),
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
        if (params.cursor) query.cursor = params.cursor;

        const data = await renderGet<Array<{ instance: Record<string, unknown>; cursor: string }>>(
          `/services/${params.service_id}/instances`,
          query
        );
        const instances = data.map((d) => d.instance);

        const lines: string[] = [`# Instances — ${params.service_id} (${instances.length})\n`];
        for (const i of instances) {
          lines.push(`## ${i.id}`);
          lines.push(`- **Status**: ${i.status}`);
          lines.push(`- **Created**: ${i.createdAt}`);
          if (i.region) lines.push(`- **Region**: ${i.region}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncateIfNeeded(lines.join("\n")) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Environment Groups ───────────────────────────────────────────
  server.registerTool(
    "render_list_env_groups",
    {
      title: "List Environment Groups",
      description: `List all environment groups in your account.

Args:
  - name (string, optional): Filter by name
  - limit (number): Max results (default 20, max 100)
  - cursor (string, optional): Pagination cursor

Returns: Environment groups with id, name, description, variables count.`,
      inputSchema: {
        name: z.string().optional().describe("Filter by name"),
        limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
        cursor: z.string().optional().describe("Pagination cursor"),
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
        if (params.cursor) query.cursor = params.cursor;

        const data = await renderGet<Array<{ envGroup: Record<string, unknown>; cursor: string }>>(
          "/env-groups",
          query
        );
        const groups = data.map((d) => d.envGroup);

        const lines: string[] = [`# Environment Groups (${groups.length})\n`];
        for (const g of groups) {
          lines.push(`## ${g.name} (${g.id})`);
          if (g.description) lines.push(`- **Description**: ${g.description}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncateIfNeeded(lines.join("\n")) }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Create Environment Group ─────────────────────────────────────
  server.registerTool(
    "render_create_env_group",
    {
      title: "Create Environment Group",
      description: `Create a new environment group.

Args:
  - name (string): Name for the environment group
  - description (string, optional): Description
  - env_vars (array, optional): Array of {key, value} objects

Returns: Created environment group details.`,
      inputSchema: {
        name: z.string().min(1).describe("Environment group name"),
        description: z.string().optional().describe("Description"),
        env_vars: z.array(z.object({
          key: z.string(),
          value: z.string()
        })).optional().describe("Environment variables"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = { name: params.name };
        if (params.description) body.description = params.description;
        if (params.env_vars) body.envVars = params.env_vars;

        const group = await renderPost<Record<string, unknown>>("/env-groups", body);
        return { content: [{ type: "text", text: `Environment group created.\n\n${JSON.stringify(group, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Update Environment Group ───────────────────────────────────
  server.registerTool(
    "render_update_env_group",
    {
      title: "Update Environment Group",
      description: `Update an environment group.

Args:
  - env_group_id (string): The environment group ID
  - name (string, optional): New name
  - description (string, optional): New description
  - env_vars (array, optional): Array of {key, value} to add/update

Returns: Updated group details.`,
      inputSchema: {
        env_group_id: z.string().min(1).describe("Environment group ID"),
        name: z.string().optional().describe("New name"),
        description: z.string().optional().describe("New description"),
        env_vars: z.array(z.object({
          key: z.string(),
          value: z.string()
        })).optional().describe("Variables to add/update"),
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
        if (params.description) body.description = params.description;
        if (params.env_vars) body.envVars = params.env_vars;

        const group = await renderPatch<Record<string, unknown>>(`/env-groups/${params.env_group_id}`, body);
        return { content: [{ type: "text", text: `Environment group updated.\n\n${JSON.stringify(group, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // ─── Delete Environment Group ────────────────────────────────────
  server.registerTool(
    "render_delete_env_group",
    {
      title: "Delete Environment Group",
      description: `Delete an environment group.

Args:
  - env_group_id (string): The environment group ID to delete

Returns: Confirmation.`,
      inputSchema: {
        env_group_id: z.string().min(1).describe("Environment group ID to delete"),
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
        await renderDelete(`/env-groups/${params.env_group_id}`);
        return { content: [{ type: "text", text: `Environment group ${params.env_group_id} deleted.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
