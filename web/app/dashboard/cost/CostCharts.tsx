'use client';

import { memo } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DailyCost {
  date: string;
  cost: number;
  tokens: number;
}

const tooltipStyle = { background: '#09090b', border: '1px solid #27272a', fontSize: 12 };
const axisTickStyle = { fill: '#71717a', fontSize: 10 };

function CostCharts({ daily }: { daily: DailyCost[] }) {
  return (
    <>
      {/* Daily cost chart */}
      <div className="bg-zinc-950 border border-zinc-800 p-5 mb-px">
        <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Daily Cost</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" tick={axisTickStyle} />
            <YAxis tick={axisTickStyle} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#71717a' }}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
            />
            <Area type="monotone" dataKey="cost" stroke="#4ade80" fill="#4ade80" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Token usage chart */}
      <div className="bg-zinc-950 border border-zinc-800 p-5 mt-px">
        <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Token Usage</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" tick={axisTickStyle} />
            <YAxis tick={axisTickStyle} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#71717a' }}
              formatter={(value: any) => [`${(value / 1000).toFixed(0)}K`, 'Tokens']}
            />
            <Bar dataKey="tokens" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

export default memo(CostCharts);
