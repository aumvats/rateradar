'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { RateScoreBadge } from '@/components/ui/RateScoreBadge';
import { TrendArrow } from '@/components/ui/TrendArrow';
import { RateChart } from '@/components/features/RateChart';
import { PairStats } from '@/components/features/PairStats';
import { SkeletonChart } from '@/components/ui/LoadingSkeleton';
import { getCurrentRates, getTimeSeries } from '@/lib/api/frankfurter';
import { computeRateScore, computeStats } from '@/lib/rateScore';
import { getCurrencyInfo } from '@/lib/api/countries';
import { formatRate, daysAgo } from '@/lib/utils';
import type { PairStats as PairStatsType, TimeSeriesPoint } from '@/types';

export default function PairDetailPage() {
  const params = useParams();
  // useParams() types segments as string | string[] | undefined — narrow defensively
  const fromParam = Array.isArray(params.from) ? params.from[0] : params.from;
  const toParam = Array.isArray(params.to) ? params.to[0] : params.to;
  const from = (fromParam ?? '').toUpperCase();
  const to = (toParam ?? '').toUpperCase();

  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [stats, setStats] = useState<PairStatsType | null>(null);
  const [chartData, setChartData] = useState<{ date: string; rate: number; score?: number }[]>([]);
  const [lookback, setLookback] = useState<30 | 90 | 365>(30);
  const [fullSeries, setFullSeries] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fromInfo = getCurrencyInfo(from);
  const toInfo = getCurrencyInfo(to);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch current rate
      const rates = await getCurrentRates(from, [to]);
      const rate = rates[to];
      if (!rate) {
        setError('Unable to fetch rate for this pair.');
        setLoading(false);
        return;
      }
      setCurrentRate(rate);

      // Fetch full 365-day time series
      const series = await getTimeSeries(from, to, daysAgo(365), daysAgo(0));
      setFullSeries(series);

      if (series.length > 0) {
        const historicalRates = series.map(s => s.rate);
        const rateScore = computeRateScore(rate, historicalRates);
        setScore(rateScore);
        setStats(computeStats(series, rate));

        // Set chart data for current lookback
        updateChartData(series, lookback);
      }
    } catch {
      setError('Failed to load pair data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  function updateChartData(series: TimeSeriesPoint[], lb: number) {
    const sliced = series.slice(-lb);
    setChartData(sliced.map(s => ({ date: s.date, rate: s.rate })));
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleLookbackChange(lb: 30 | 90 | 365) {
    setLookback(lb);
    if (fullSeries.length > 0) {
      updateChartData(fullSeries, lb);

      // Recompute stats for the lookback window
      if (currentRate) {
        const sliced = fullSeries.slice(-lb);
        setStats(computeStats(sliced, currentRate));
        const historicalRates = sliced.map(s => s.rate);
        setScore(computeRateScore(currentRate, historicalRates));
      }
    }
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-error text-sm mb-3">{error}</p>
        <button onClick={loadData} className="text-accent text-sm hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{fromInfo.flag}</span>
          <span className="text-2xl">{toInfo.flag}</span>
        </div>
        <div>
          <h1 className="font-heading font-bold text-[28px] text-text-primary">
            {from}/{to}
          </h1>
          <p className="text-sm text-text-secondary">
            {fromInfo.name} to {toInfo.name}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {score !== null && <RateScoreBadge score={score} size="lg" />}
          {currentRate !== null && (
            <div className="text-right">
              <p className="font-data text-2xl font-bold text-text-primary">
                {formatRate(currentRate)}
              </p>
              {stats && <TrendArrow change={stats.dailyChange} />}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <SkeletonChart />
      ) : (
        <div className="mb-6">
          <RateChart
            data={chartData}
            currentLookback={lookback}
            onLookbackChange={handleLookbackChange}
          />
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mb-6">
          <h2 className="font-heading font-semibold text-[18px] text-text-primary mb-3">
            Statistics ({lookback}-day window)
          </h2>
          <PairStats stats={stats} />
        </div>
      )}

      {/* Score explanation */}
      {score !== null && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Rate Score: {score}</span> — Today&apos;s {from}/{to} rate is better than{' '}
            <span className="font-data font-medium">{score}%</span> of rates in the past {lookback} days.
            {score >= 70 && ' This is a favorable time to exchange.'}
            {score <= 30 && ' You may want to wait for a better rate.'}
          </p>
        </div>
      )}
    </div>
  );
}
