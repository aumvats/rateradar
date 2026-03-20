'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CurrencyPairCard } from '@/components/ui/CurrencyPairCard';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton';
import { PairPickerModal } from '@/components/features/PairPickerModal';
import { getCurrentRates, getTimeSeries } from '@/lib/api/frankfurter';
import { detectHomeCurrency } from '@/lib/api/ipapi';
import { fetchAndCacheCurrencyMetadata } from '@/lib/api/countries';
import { computeRateScore } from '@/lib/rateScore';
import { setHomeCurrency, setTrackedPairs } from '@/lib/storage';
import { daysAgo } from '@/lib/utils';

interface PreviewCard {
  from: string;
  to: string;
  rate: number;
  score: number;
  dailyChange: number;
  sparklineData: number[];
}

const PREVIEW_PAIRS = [
  { from: 'USD', to: 'EUR' },
  { from: 'USD', to: 'GBP' },
  { from: 'USD', to: 'JPY' },
];

export default function LandingPage() {
  const router = useRouter();
  const [cards, setCards] = useState<PreviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [detectedCurrency, setDetectedCurrency] = useState('USD');
  const [error, setError] = useState(false);

  useEffect(() => {
    async function init() {
      fetchAndCacheCurrencyMetadata();
      const home = await detectHomeCurrency();
      setDetectedCurrency(home);

      try {
        const rates = await getCurrentRates('USD', ['EUR', 'GBP', 'JPY']);
        const previewCards: PreviewCard[] = [];

        for (const pair of PREVIEW_PAIRS) {
          const rate = rates[pair.to];
          if (!rate) continue;

          const series = await getTimeSeries(pair.from, pair.to, daysAgo(365), daysAgo(0));
          const historicalRates = series.map(s => s.rate);
          const score = computeRateScore(rate, historicalRates);
          const last30 = series.slice(-30).map(s => s.rate);

          const prevRate = historicalRates.length >= 2
            ? historicalRates[historicalRates.length - 2]
            : rate;
          const dailyChange = prevRate > 0 ? ((rate - prevRate) / prevRate) * 100 : 0;

          previewCards.push({
            from: pair.from,
            to: pair.to,
            rate,
            score,
            dailyChange,
            sparklineData: last30,
          });
        }

        setCards(previewCards);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  function handlePickerComplete(homeCurrency: string, targets: string[]) {
    setHomeCurrency(homeCurrency);
    setTrackedPairs(targets);
    setShowPicker(false);
    router.push('/dashboard');
  }

  return (
    <div>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <h1 className="font-heading font-bold text-[28px] sm:text-4xl text-text-primary mb-3 animate-slide-up">
          Know When to Exchange
        </h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-10 animate-stagger-1">
          A currency monitoring dashboard that gives you a simple 0-100 favorability score for every exchange rate you care about.
        </p>
        <button
          onClick={() => setShowPicker(true)}
          className="px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 active:scale-[0.97] transition-all duration-150 text-base shadow-sm hover:shadow-md animate-stagger-2"
        >
          Track Your Currencies
        </button>
      </section>

      {/* Live Preview Cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="font-heading font-semibold text-[22px] text-text-primary mb-6 text-center">
          Live Rate Scores
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading && !error ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : error ? (
            <div className="col-span-full text-center py-8">
              <p className="text-text-secondary text-sm mb-3">Rate data temporarily unavailable.</p>
              <button
                onClick={() => window.location.reload()}
                className="text-accent text-sm hover:underline"
              >
                Refresh
              </button>
            </div>
          ) : (
            cards.map(card => (
              <CurrencyPairCard
                key={`${card.from}-${card.to}`}
                from={card.from}
                to={card.to}
                rate={card.rate}
                score={card.score}
                dailyChange={card.dailyChange}
                sparklineData={card.sparklineData}
              />
            ))
          )}
        </div>
      </section>

      {/* Features */}
      <section className="bg-surface border-t border-border py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading font-semibold text-[22px] text-text-primary mb-10 text-center">
            How RateRadar Helps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <FeatureBlock
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                </svg>
              }
              title="Rate Score"
              description="A 0-100 score telling you how today's rate compares to the past year. Above 70? It's a good day to exchange."
            />
            <FeatureBlock
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                  <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
              title="Trend Charts"
              description="See 30, 90, or 365-day trends with sparklines on every card. Spot patterns at a glance."
            />
            <FeatureBlock
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
                </svg>
              }
              title="Rate Alerts"
              description="Set a threshold on any pair. Get an email the moment conditions are favorable."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="font-heading font-semibold text-[22px] text-text-primary mb-10 text-center">
          Simple Pricing
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <PricingCard
            name="Free"
            price="$0"
            features={[
              'Track up to 3 currency pairs',
              '30-day historical charts',
              '1 rate alert',
              'Basic calculator',
              'Works without signup',
            ]}
            cta="Get Started"
            onCta={() => setShowPicker(true)}
          />
          <PricingCard
            name="Pro"
            price="$14"
            period="/mo"
            features={[
              'Unlimited currency pairs',
              '365-day historical charts',
              '20 rate alerts',
              'Daily email digest',
              'CSV export',
            ]}
            cta="Start Pro"
            highlighted
            onCta={() => setShowPicker(true)}
          />
        </div>
      </section>

      {/* Pair Picker Modal */}
      {showPicker && (
        <PairPickerModal
          defaultHomeCurrency={detectedCurrency}
          onComplete={handlePickerComplete}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

function FeatureBlock({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center group">
      <div className="w-12 h-12 bg-accent/5 rounded-lg flex items-center justify-center mx-auto mb-3 transition-transform duration-200 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="font-heading font-semibold text-base text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  features,
  cta,
  highlighted,
  onCta,
}: {
  name: string;
  price: string;
  period?: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  onCta: () => void;
}) {
  return (
    <div className={`border rounded-xl p-6 transition-all duration-200 hover:shadow-md ${highlighted ? 'border-accent bg-accent/[0.02] shadow-sm' : 'border-border bg-surface hover:border-accent/30'}`}>
      <h3 className="font-heading font-bold text-lg text-text-primary">{name}</h3>
      <div className="mt-2 mb-4">
        <span className="font-data text-3xl font-bold text-text-primary">{price}</span>
        {period && <span className="text-text-secondary text-sm">{period}</span>}
      </div>
      <ul className="space-y-2 mb-6">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
            <svg className="w-4 h-4 text-success mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onCta}
        className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-150 active:scale-[0.98] ${
          highlighted
            ? 'bg-accent text-white hover:bg-accent/90 shadow-sm'
            : 'border border-border text-text-primary hover:bg-bg active:bg-border/50'
        }`}
      >
        {cta}
      </button>
    </div>
  );
}
