'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { cn, formatRate, formatDateShort } from '@/lib/utils';

interface ChartDataPoint {
  date: string;
  rate: number;
  score?: number;
}

interface RateChartProps {
  data: ChartDataPoint[];
  currentLookback?: 30 | 90 | 365;
  onLookbackChange?: (lookback: 30 | 90 | 365) => void;
  showToggle?: boolean;
}

const LOOKBACKS = [30, 90, 365] as const;

export function RateChart({
  data,
  currentLookback = 30,
  onLookbackChange,
  showToggle = true,
}: RateChartProps) {
  const [activeLookback, setActiveLookback] = useState(currentLookback);

  function handleLookbackChange(lb: 30 | 90 | 365) {
    setActiveLookback(lb);
    onLookbackChange?.(lb);
  }

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <p className="text-text-secondary text-sm text-center py-12">
          No chart data available. Try refreshing the page.
        </p>
      </div>
    );
  }

  const rates = data.map(d => d.rate);
  const minRate = rates.reduce((a, b) => Math.min(a, b), Infinity);
  const maxRate = rates.reduce((a, b) => Math.max(a, b), -Infinity);
  const padding = (maxRate - minRate) * 0.1 || 0.001;
  const lastPoint = data[data.length - 1];

  // Find best and worst rates
  const bestIdx = rates.indexOf(maxRate);
  const worstIdx = rates.indexOf(minRate);

  return (
    <div className="bg-surface border border-border rounded-lg p-4 sm:p-6">
      {showToggle && (
        <div className="flex items-center gap-1 mb-4">
          {LOOKBACKS.map(lb => (
            <button
              key={lb}
              onClick={() => handleLookbackChange(lb)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                activeLookback === lb
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-bg hover:text-text-primary active:bg-border/50'
              )}
            >
              {lb}D
            </button>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatDateShort(d)}
            tick={{ fontSize: 11, fill: '#64748B' }}
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            domain={[minRate - padding, maxRate + padding]}
            tickFormatter={(v: number) => formatRate(v)}
            tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'var(--font-data)' }}
            tickLine={false}
            axisLine={false}
            width={65}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as ChartDataPoint;
              return (
                <div className="bg-surface border border-border rounded-lg shadow-lg px-3 py-2">
                  <p className="text-xs text-text-secondary">{formatDateShort(point.date)}</p>
                  <p className="font-data font-medium text-text-primary">{formatRate(point.rate)}</p>
                  {point.score !== undefined && (
                    <p className="text-xs text-text-secondary">Score: {point.score}</p>
                  )}
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#2563EB"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
          />
          {/* Current rate dot */}
          {lastPoint && (
            <ReferenceDot
              x={lastPoint.date}
              y={lastPoint.rate}
              r={4}
              fill="#2563EB"
              stroke="#fff"
              strokeWidth={2}
            />
          )}
          {/* Best rate marker */}
          {data[bestIdx] && (
            <ReferenceDot
              x={data[bestIdx].date}
              y={data[bestIdx].rate}
              r={3}
              fill="#10B981"
              stroke="#fff"
              strokeWidth={1}
            />
          )}
          {/* Worst rate marker */}
          {data[worstIdx] && (
            <ReferenceDot
              x={data[worstIdx].date}
              y={data[worstIdx].rate}
              r={3}
              fill="#EF4444"
              stroke="#fff"
              strokeWidth={1}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
