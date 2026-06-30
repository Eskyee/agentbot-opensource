import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { shadcnComponentDefinitions } from '@json-render/shadcn/catalog';
import { z } from 'zod';

export const agentbotCatalog = defineCatalog(schema, {
  components: {
    Card: shadcnComponentDefinitions.Card,
    Stack: shadcnComponentDefinitions.Stack,
    Heading: shadcnComponentDefinitions.Heading,
    Button: shadcnComponentDefinitions.Button,
    Input: shadcnComponentDefinitions.Input,
    Badge: shadcnComponentDefinitions.Badge,
    Separator: shadcnComponentDefinitions.Separator,
    Metric: {
      props: z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        change: z.number().optional(),
        format: z.enum(['number', 'currency', 'percent']).optional(),
      }),
      description: 'Displays a metric value with optional change indicator',
    },
    CodeBlock: {
      props: z.object({
        code: z.string(),
        language: z.string().optional(),
      }),
      description: 'Syntax highlighted code block',
    },
    StatusBadge: {
      props: z.object({
        status: z.enum(['active', 'inactive', 'pending', 'error']),
        label: z.string().optional(),
      }),
      description: 'Shows agent status with color coding',
    },
  },
  actions: {
    navigate: {
      params: z.object({ url: z.string() }),
      description: 'Navigate to a URL',
    },
    callback: {
      params: z.object({
        name: z.string(),
        data: z.record(z.string(), z.unknown()).optional(),
      }),
      description: 'Trigger a callback to the agent',
    },
  },
});
