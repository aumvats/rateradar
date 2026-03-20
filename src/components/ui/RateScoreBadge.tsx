'use client';

import { cn } from '@/lib/utils';

interface RateScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { container: 'w-12 h-12', text: 'text-base' },
  md: { container: 'w-16 h-16', text: 'text-2xl' },
  lg: { container: 'w-24 h-24', text: 'text-4xl' },
};

function getScoreBg(score: number): string {
  if (score <= 30) return 'bg-error';
  if (score <= 60) return 'bg-warning';
  return 'bg-success';
}

export function RateScoreBadge({ score, size = 'md' }: RateScoreBadgeProps) {
  const s = sizeMap[size];
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0',
        getScoreBg(clampedScore),
        s.container
      )}
      role="meter"
      aria-valuenow={clampedScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Rate Score: ${clampedScore} out of 100`}
    >
      <span className={cn('font-data font-bold text-white', s.text)}>
        {clampedScore}
      </span>
    </div>
  );
}
