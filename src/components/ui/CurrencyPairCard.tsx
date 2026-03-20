'use client';

import Link from 'next/link';
import { RateScoreBadge } from './RateScoreBadge';
import { Sparkline } from './Sparkline';
import { TrendArrow } from './TrendArrow';
import { getCurrencyInfo } from '@/lib/api/countries';
import { formatRate } from '@/lib/utils';

interface CurrencyPairCardProps {
  from: string;
  to: string;
  rate: number;
  score: number;
  dailyChange: number;
  sparklineData: number[];
  onAlertClick?: () => void;
}

export function CurrencyPairCard({
  from,
  to,
  rate,
  score,
  dailyChange,
  sparklineData,
  onAlertClick,
}: CurrencyPairCardProps) {
  const fromInfo = getCurrencyInfo(from);
  const toInfo = getCurrencyInfo(to);

  return (
    <Link
      href={`/pair/${from.toLowerCase()}/${to.toLowerCase()}`}
      className="block bg-surface border border-border rounded-lg p-5 hover:border-accent/40 hover:shadow-md active:shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{fromInfo.flag}</span>
          <span className="text-lg">{toInfo.flag}</span>
          <span className="font-heading font-semibold text-lg text-text-primary">
            {from}/{to}
          </span>
        </div>
        {onAlertClick && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onAlertClick(); }}
            className="p-1.5 rounded-md hover:bg-bg text-text-secondary hover:text-accent active:scale-90 transition-all duration-150"
            aria-label={`Set alert for ${from}/${to}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 14h4M3 6a5 5 0 0110 0c0 2.5 1 4 2 5H1c1-1 2-2.5 2-5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <RateScoreBadge score={score} />
        <div className="flex-1 min-w-0">
          <div className="font-data text-lg font-medium text-text-primary">
            {formatRate(rate)}
          </div>
          <TrendArrow change={dailyChange} />
        </div>
        <Sparkline data={sparklineData} />
      </div>
    </Link>
  );
}
