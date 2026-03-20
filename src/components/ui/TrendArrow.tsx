'use client';

import { cn, formatPercent } from '@/lib/utils';

interface TrendArrowProps {
  change: number;
  showValue?: boolean;
}

export function TrendArrow({ change, showValue = true }: TrendArrowProps) {
  const isUp = change > 0.005;
  const isDown = change < -0.005;

  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 font-data text-sm font-medium',
      isUp && 'text-success',
      isDown && 'text-error',
      !isUp && !isDown && 'text-text-secondary'
    )}>
      {isUp && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 2L10 7H2L6 2Z" />
        </svg>
      )}
      {isDown && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 10L2 5H10L6 10Z" />
        </svg>
      )}
      {!isUp && !isDown && <span>\u2014</span>}
      {showValue && <span>{formatPercent(change)}</span>}
    </span>
  );
}
