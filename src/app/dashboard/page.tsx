'use client';

import { useEffect, useState, useCallback } from 'react';
import { CurrencyPairCard } from '@/components/ui/CurrencyPairCard';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton';
import { PairPickerModal } from '@/components/features/PairPickerModal';
import { AlertModal } from '@/components/features/AlertModal';
import { getCurrentRates, getTimeSeries } from '@/lib/api/frankfurter';
import { computeRateScore } from '@/lib/rateScore';
import {
  getTrackedPairs,
  setTrackedPairs,
  getHomeCurrency,
  setHomeCurrency,
  getSessionCache,
  setSessionCache,
} from '@/lib/storage';
import { daysAgo } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface PairData {
  from: string;
  to: string;
  rate: number;
  score: number;
  dailyChange: number;
  sparklineData: number[];
}

export default function DashboardPage() {
  const { showToast } = useToast();
  const [pairs, setPairs] = useState<PairData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [alertPair, setAlertPair] = useState<{ from: string; to: string } | null>(null);

  const homeCurrency = typeof window !== 'undefined' ? getHomeCurrency() : 'USD';
  const trackedPairs = typeof window !== 'undefined' ? getTrackedPairs() : [];

  const loadPairData = useCallback(async () => {
    const home = getHomeCurrency();
    const targets = getTrackedPairs();

    if (targets.length === 0) {
      setLoading(false);
      return;
    }

    setError(false);

    try {
      // Try to load from session cache first for instant display
      const cacheKey = `dashboard_${home}_${targets.join(',')}`;
      const cached = getSessionCache<PairData[]>(cacheKey);
      if (cached) {
        setPairs(cached);
        setLoading(false);
      }

      // Fetch fresh data
      const rates = await getCurrentRates(home, targets);
      const freshPairs: PairData[] = [];

      for (const to of targets) {
        const rate = rates[to];
        if (!rate) continue;

        const series = await getTimeSeries(home, to, daysAgo(365), daysAgo(0));
        const historicalRates = series.map(s => s.rate);
        const score = computeRateScore(rate, historicalRates);
        const last30 = series.slice(-30).map(s => s.rate);

        const prevRate = historicalRates.length >= 2
          ? historicalRates[historicalRates.length - 2]
          : rate;
        const dailyChange = prevRate > 0 ? ((rate - prevRate) / prevRate) * 100 : 0;

        freshPairs.push({
          from: home,
          to,
          rate,
          score,
          dailyChange,
          sparklineData: last30,
        });
      }

      setPairs(freshPairs);
      setSessionCache(cacheKey, freshPairs, 5 * 60 * 1000);
    } catch {
      if (pairs.length === 0) setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPairData();
  }, [loadPairData]);

  function handlePickerComplete(home: string, targets: string[]) {
    setHomeCurrency(home);
    setTrackedPairs(targets);
    setShowPicker(false);
    setLoading(true);
    loadPairData();
    showToast('Dashboard updated!', 'success');
  }

  function handleRemovePair(to: string) {
    const updated = trackedPairs.filter(p => p !== to);
    setTrackedPairs(updated);
    setPairs(prev => prev.filter(p => p.to !== to));
    showToast(`Removed ${homeCurrency}/${to}`, 'info');
  }

  // Empty state
  if (!loading && trackedPairs.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 bg-accent/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
            <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-heading font-bold text-xl text-text-primary mb-2">No pairs tracked yet</h2>
        <p className="text-text-secondary text-sm mb-6">Add your first currency pair to start monitoring exchange rates.</p>
        <button
          onClick={() => setShowPicker(true)}
          className="px-5 py-2.5 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent/90 active:scale-[0.97] transition-all duration-150 shadow-sm"
        >
          Add Currency Pairs
        </button>
        {showPicker && (
          <PairPickerModal
            defaultHomeCurrency={homeCurrency}
            onComplete={handlePickerComplete}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-[28px] text-text-primary">Dashboard</h1>
        <button
          onClick={() => setShowPicker(true)}
          className="px-4 py-2 text-sm text-accent border border-accent/30 rounded-lg hover:bg-accent/5 active:bg-accent/10 active:scale-[0.97] transition-all duration-150"
        >
          + Add Pair
        </button>
      </div>

      {/* Error banner */}
      {error && pairs.length === 0 && (
        <div className="bg-error/5 border border-error/20 rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-error mb-2">Rate data temporarily unavailable.</p>
          <button onClick={loadPairData} className="text-sm text-accent hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: trackedPairs.length || 3 }).map((_, i) => <SkeletonCard key={i} />)
          : pairs.map(p => (
              <div key={`${p.from}-${p.to}`} className="relative group">
                <CurrencyPairCard
                  from={p.from}
                  to={p.to}
                  rate={p.rate}
                  score={p.score}
                  dailyChange={p.dailyChange}
                  sparklineData={p.sparklineData}
                  onAlertClick={() => setAlertPair({ from: p.from, to: p.to })}
                />
                <button
                  onClick={() => handleRemovePair(p.to)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-surface border border-border text-text-secondary hover:text-error hover:border-error/30 active:scale-90 transition-all duration-150 text-xs"
                  aria-label={`Remove ${p.from}/${p.to} pair`}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
      </div>

      {/* Modals */}
      {showPicker && (
        <PairPickerModal
          defaultHomeCurrency={homeCurrency}
          onComplete={handlePickerComplete}
          onClose={() => setShowPicker(false)}
        />
      )}

      {alertPair && (
        <AlertModal
          from={alertPair.from}
          to={alertPair.to}
          onClose={() => setAlertPair(null)}
          onSave={(alert) => {
            showToast(`Alert created for ${alertPair.from}/${alertPair.to}`, 'success');
            setAlertPair(null);
          }}
        />
      )}
    </div>
  );
}
