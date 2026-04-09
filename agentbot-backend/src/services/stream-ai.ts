/**
 * OpenRouter Streaming Service
 *
 * Uses @openrouter/sdk for streaming chat completions with:
 * - Real-time token streaming (SSE)
 * - Reasoning token tracking
 * - Provider routing (price/speed/latency sorting)
 *
 * ESM-only SDK loaded via dynamic import (this file compiles to CJS).
 */

import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface StreamOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  provider?: {
    sort?: 'price' | 'throughput' | 'latency';
    zdr?: boolean; // zero data retention
  };
}

/**
 * Stream a chat completion via SSE.
 *
 * Client receives:
 *  - event: chunk   → partial content tokens
 *  - event: done    → final usage + model info
 *  - event: error   → error message
 */
export async function streamChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  res: Response,
  options: StreamOptions = {}
): Promise<void> {
  // Dynamic import for ESM-only SDK
  const { OpenRouter } = await import('@openrouter/sdk');

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'OpenRouter API key not configured' });
    return;
  }

  const openrouter = new OpenRouter({ apiKey });

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disable nginx buffering
  });

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15_000);

  const cleanup = () => {
    clearInterval(heartbeat);
  };

  res.on('close', cleanup);

  try {
    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model: options.model || 'openai/gpt-4o-mini',
        messages: messages as any,
        stream: true,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.max_tokens,
        provider: options.provider ? {
          sort: options.provider.sort,
          zdr: options.provider.zdr,
        } : undefined,
      },
    });

    let fullContent = '';
    let usage: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
      reasoningTokens?: number;
    } | null = null;
    let modelId = options.model || 'unknown';

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        fullContent += content;
        res.write(`event: chunk\ndata: ${JSON.stringify({ content })}\n\n`);
      }

      // Capture model from first chunk
      if (chunk.model) {
        modelId = chunk.model;
      }

      // Usage comes in the final chunk
      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.promptTokens,
          completionTokens: chunk.usage.completionTokens,
          totalTokens: chunk.usage.totalTokens,
          reasoningTokens: (chunk.usage as any).reasoningTokens,
        };
      }
    }

    // Send completion event with usage data
    res.write(
      `event: done\ndata: ${JSON.stringify({
        model: modelId,
        usage,
        contentLength: fullContent.length,
      })}\n\n`
    );

    // Log usage to DB (fire-and-forget)
    if (usage) {
      pool
        .query(
          `INSERT INTO model_metrics
             (model, input_tokens, output_tokens, latency_ms, success, source, created_at)
           VALUES ($1, $2, $3, $4, true, 'openrouter-stream', NOW())`,
          [
            modelId,
            usage.promptTokens ?? 0,
            usage.completionTokens ?? 0,
            0, // latency tracked client-side for streaming
          ]
        )
        .catch((err) => console.error('[StreamAI] Usage logging failed:', err.message));
    }
  } catch (error: any) {
    res.write(
      `event: error\ndata: ${JSON.stringify({
        error: error.message || 'Stream failed',
        code: error.code,
      })}\n\n`
    );
  } finally {
    cleanup();
    res.end();
  }
}
