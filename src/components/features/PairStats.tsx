'use client';

import { formatRate, formatPercent } from '@/lib/utils';
import type { PairStats as PairStatsType } from '@/types';

interface PairStatsProps {
  stats: PairStatsType;
}

export function PairStats({ stats }: PairStatsProps) {
  const items = [
    { label: 'Current', value: formatRate(stats.current) },
    { label: 'Min', value: formatRate(stats.min) },
    { label: 'Max', value: formatRate(stats.max) },
    { label: 'Average', value: formatRate(stats.avg) },
    { label: 'Daily Change', value: formatPercent(stats.dailyChange), colored: true },
    { label: 'Volatility', value: `${stats.volatility.toFixed(2)}%` },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {items.map(item => (
        <div key={item.label} className="bg-surface border border-border rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">{item.label}</p>
          <p className={`font-data font-medium text-base ${
            item.colored
              ? stats.dailyChange >= 0 ? 'text-success' : 'text-error'
              : 'text-text-primary'
          }`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
