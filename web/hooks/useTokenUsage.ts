'use client';

import { useQuery } from '@tanstack/react-query';

interface UsageBucket {
  model: string;
  calls: number;
  input: number;
  output: number;
  cacheRead: number;
  totalTokens: number;
  cost: number;
}

interface DailyChartEntry {
  date: string;
  label: string;
  total: number;
  tokens: number;
  models: Record<string, number>;
}

interface TokenUsageData {
  today: UsageBucket[];
  week: UsageBucket[];
  month: UsageBucket[];
  all: UsageBucket[];
  dailyChart: DailyChartEntry[];
}

async function fetchTokenUsage(): Promise<TokenUsageData> {
  const res = await fetch('/api/usage/tokens');
  if (!res.ok) throw new Error('Failed to fetch token usage');
  return res.json();
}

export function useTokenUsage() {
  return useQuery<TokenUsageData>({
    queryKey: ['token-usage'],
    queryFn: fetchTokenUsage,
    staleTime: 5 * 60 * 1000,
  });
}
