/**
 * Render API client — shared HTTP utilities for all tools.
 *
 * Base URL: https://api.render.com/v1
 * Auth: Bearer token via RENDER_API_KEY env var
 */

import axios, { AxiosError, AxiosInstance } from "axios";

const API_BASE_URL = "https://api.render.com/v1";
export const CHARACTER_LIMIT = 25000;

let client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!client) {
    const apiKey = process.env.RENDER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RENDER_API_KEY environment variable is required. " +
        "Get your API key from https://dashboard.render.com/u/settings#api-keys"
      );
    }
    client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
  }
  return client;
}

export async function renderGet<T>(
  endpoint: string,
  params?: Record<string, unknown>
): Promise<T> {
  const res = await getClient().get(endpoint, { params });
  return res.data;
}

export async function renderPost<T>(
  endpoint: string,
  data?: Record<string, unknown> | Array<Record<string, unknown>>
): Promise<T> {
  const res = await getClient().post(endpoint, data);
  return res.data;
}

export async function renderPatch<T>(
  endpoint: string,
  data?: Record<string, unknown>
): Promise<T> {
  const res = await getClient().patch(endpoint, data);
  return res.data;
}

export async function renderDelete<T>(
  endpoint: string
): Promise<T> {
  const res = await getClient().delete(endpoint);
  return res.data;
}

export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      const status = error.response.status;
      const body = error.response.data;
      const message = typeof body === "object" && body?.message
        ? body.message
        : JSON.stringify(body);

      switch (status) {
        case 401:
          return "Error: Invalid API key. Check your RENDER_API_KEY environment variable.";
        case 403:
          return `Error: Permission denied. Your API key may lack access to this resource. ${message}`;
        case 404:
          return "Error: Resource not found. Check the service/deploy/database ID.";
        case 429:
          return "Error: Rate limit exceeded. Render allows 100 requests per minute. Wait and retry.";
        case 402:
          return "Error: Payment required. This operation needs a paid Render plan.";
        default:
          return `Error: Render API returned ${status} — ${message}`;
      }
    } else if (error.code === "ECONNABORTED") {
      return "Error: Request timed out. The Render API may be slow — try again.";
    }
  }
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  return `Error: Unexpected error — ${String(error)}`;
}

/**
 * Truncate a response string if it exceeds CHARACTER_LIMIT.
 */
export function truncateIfNeeded(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return (
    text.slice(0, CHARACTER_LIMIT) +
    "\n\n---\n⚠️ Response truncated. Use `limit` or filters to narrow results."
  );
}
