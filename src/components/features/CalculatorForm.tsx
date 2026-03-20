'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { RateScoreBadge } from '@/components/ui/RateScoreBadge';
import { Sparkline } from '@/components/ui/Sparkline';
import { getCurrentRates, getTimeSeries } from '@/lib/api/frankfurter';
import { computeRateScore } from '@/lib/rateScore';
import { formatRate, daysAgo } from '@/lib/utils';
import { getHomeCurrency } from '@/lib/storage';
import { useToast } from '@/components/ui/Toast';

export function CalculatorForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [amount, setAmount] = useState(searchParams.get('amount') ?? '');
  const [fromCurrency, setFromCurrency] = useState(searchParams.get('from')?.toUpperCase() ?? getHomeCurrency());
  const [toCurrency, setToCurrency] = useState(searchParams.get('to')?.toUpperCase() ?? 'EUR');
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [sparklineData, setSparklineData] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  const calculate = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Enter a positive number');
      return;
    }
    if (fromCurrency === toCurrency) {
      setResult(numAmount);
      setRate(1);
      setScore(null);
      setSparklineData([]);
      setError(null);
      setTimestamp(new Date().toISOString());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rates = await getCurrentRates(fromCurrency, [toCurrency]);
      const currentRate = rates[toCurrency];

      if (!currentRate) {
        setError('Unable to fetch rate for this pair');
        setLoading(false);
        return;
      }

      setRate(currentRate);
      setResult(numAmount * currentRate);
      setTimestamp(new Date().toISOString());

      // Fetch time series for score + sparkline
      const series = await getTimeSeries(fromCurrency, toCurrency, daysAgo(365), daysAgo(0));
      if (series.length > 0) {
        const historicalRates = series.map(s => s.rate);
        setScore(computeRateScore(currentRate, historicalRates));
        const last30 = series.slice(-30).map(s => s.rate);
        setSparklineData(last30);
      }
    } catch {
      setError('Failed to fetch rates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [amount, fromCurrency, toCurrency]);

  // Auto-calculate when URL params present
  useEffect(() => {
    if (searchParams.get('amount') && searchParams.get('from') && searchParams.get('to')) {
      calculate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only on mount when URL params are pre-populated
  }, []);

  function handleShare() {
    const url = `${window.location.origin}/calculator?amount=${amount}&from=${fromCurrency.toLowerCase()}&to=${toCurrency.toLowerCase()}`;
    navigator.clipboard.writeText(url);
    showToast('Link copied!', 'success');
  }

  return (
    <div className="space-y-6">
      {/* Input fields */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="10,000"
              className="w-full px-3 py-2.5 border border-border rounded-md font-data text-lg bg-bg focus:outline-none focus:border-accent"
              min="0"
              step="any"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CurrencyPicker value={fromCurrency} onChange={setFromCurrency} label="From" />
            <CurrencyPicker value={toCurrency} onChange={setToCurrency} label="To" />
          </div>

          <button
            onClick={() => {
              calculate();
              // Update URL params
              router.replace(
                `/calculator?amount=${amount}&from=${fromCurrency.toLowerCase()}&to=${toCurrency.toLowerCase()}`,
                { scroll: false }
              );
            }}
            disabled={loading}
            className="w-full py-2.5 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 shadow-sm hover:shadow-md disabled:shadow-none"
          >
            {loading ? 'Converting...' : 'Convert'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/5 border border-error/20 rounded-lg p-4 text-sm text-error">
          {error}
        </div>
      )}

      {/* Result */}
      {result !== null && rate !== null && (
        <div className="bg-surface border border-border rounded-lg p-5 space-y-4 animate-slide-up">
          <div>
            <p className="text-sm text-text-secondary mb-1">
              {amount} {fromCurrency} =
            </p>
            <p className="font-data text-3xl font-bold text-text-primary">
              {new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(result)}{' '}
              <span className="text-xl">{toCurrency}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <span>1 {fromCurrency} = <span className="font-data">{formatRate(rate)}</span> {toCurrency}</span>
            {timestamp && (
              <span className="text-xs">
                {new Date(timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Rate Score */}
          {score !== null && (
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <RateScoreBadge score={score} size="sm" />
              <p className="text-sm text-text-secondary">
                This rate is better than <span className="font-data font-medium text-text-primary">{score}%</span> of the past year.
              </p>
            </div>
          )}

          {/* Sparkline */}
          {sparklineData.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-text-secondary mb-2">30-day trend</p>
              <Sparkline data={sparklineData} width={280} height={48} />
            </div>
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            className="text-sm text-accent hover:underline active:opacity-70 transition-opacity"
          >
            Share this calculation
          </button>
        </div>
      )}
    </div>
  );
}
