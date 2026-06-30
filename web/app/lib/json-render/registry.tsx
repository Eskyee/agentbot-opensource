'use client';

import { defineRegistry, type ActionFn } from '@json-render/react';
import { shadcnComponents } from '@json-render/shadcn';
import { agentbotCatalog } from './catalog';

export const { registry: agentbotRegistry, handlers: agentbotHandlers } = defineRegistry(
  agentbotCatalog,
  {
    components: {
      Card: shadcnComponents.Card,
      Stack: shadcnComponents.Stack,
      Heading: shadcnComponents.Heading,
      Button: shadcnComponents.Button,
      Input: shadcnComponents.Input,
      Badge: shadcnComponents.Badge,
      Separator: shadcnComponents.Separator,
      Metric: ({ props }) => (
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-zinc-500">{props.label}</p>
          <p className="text-2xl font-bold">{props.value}</p>
          {props.change !== undefined && (
            <p className={`text-sm ${props.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {props.change >= 0 ? '+' : ''}
              {props.change}%
            </p>
          )}
        </div>
      ),
      CodeBlock: ({ props }) => (
        <pre className="p-4 bg-zinc-900 rounded-lg overflow-x-auto">
          <code className={`language-${props.language || 'text'}`}>{props.code}</code>
        </pre>
      ),
      StatusBadge: ({ props }) => {
        const colors = {
          active: 'bg-green-500/20 text-green-400',
          inactive: 'bg-zinc-500/20 text-zinc-400',
          pending: 'bg-yellow-500/20 text-yellow-400',
          error: 'bg-red-500/20 text-red-400',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded ${colors[props.status]}`}>
            {props.label || props.status}
          </span>
        );
      },
    },
    actions: {
      navigate: (params) => {
        if (params && 'url' in params) {
          window.location.href = params.url;
        }
      },
      callback: (params) => {
        if (params && 'name' in params) {
          console.log('Callback:', params.name, params.data);
        }
      },
    },
  }
);
