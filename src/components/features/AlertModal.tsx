'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AlertModalProps {
  from: string;
  to: string;
  onClose: () => void;
  onSave: (alert: {
    thresholdType: 'rate_score' | 'exchange_rate';
    thresholdValue: number;
    notifyOnce: boolean;
  }) => void;
}

export function AlertModal({ from, to, onClose, onSave }: AlertModalProps) {
  const [thresholdType, setThresholdType] = useState<'rate_score' | 'exchange_rate'>('rate_score');
  const [scoreValue, setScoreValue] = useState(75);
  const [rateValue, setRateValue] = useState('');
  const [notifyOnce, setNotifyOnce] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="alert-modal-title" onClick={onClose}>
      <div
        className="bg-surface rounded-xl shadow-xl w-full max-w-sm animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 id="alert-modal-title" className="font-heading font-bold text-lg text-text-primary mb-1">
            Set Alert for {from}/{to}
          </h2>
          <p className="text-sm text-text-secondary mb-5">
            Get notified when conditions are met.
          </p>

          {/* Threshold type toggle */}
          <div className="flex gap-1 bg-bg rounded-lg p-1 mb-4">
            <button
              onClick={() => setThresholdType('rate_score')}
              className={cn(
                'flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                thresholdType === 'rate_score' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Rate Score
            </button>
            <button
              onClick={() => setThresholdType('exchange_rate')}
              className={cn(
                'flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                thresholdType === 'exchange_rate' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Exchange Rate
            </button>
          </div>

          {thresholdType === 'rate_score' ? (
            <div className="mb-4">
              <label className="text-sm text-text-secondary mb-2 block">
                Alert when Rate Score is above{' '}
                <span className="font-data font-bold text-text-primary">{scoreValue}</span>
              </label>
              <input
                type="range"
                min={10}
                max={95}
                step={5}
                value={scoreValue}
                onChange={e => setScoreValue(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>10</span>
                <span>50</span>
                <span>95</span>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <label className="text-sm text-text-secondary mb-2 block">
                Alert when exchange rate reaches
              </label>
              <input
                type="number"
                value={rateValue}
                onChange={e => setRateValue(e.target.value)}
                placeholder="e.g., 1.10"
                step="0.0001"
                className="w-full px-3 py-2 border border-border rounded-md font-data bg-bg focus:outline-none focus:border-accent"
              />
            </div>
          )}

          {/* Notify frequency */}
          <label className="flex items-center gap-2 text-sm text-text-secondary mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOnce}
              onChange={e => setNotifyOnce(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent"
            />
            Notify once (disable after triggering)
          </label>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:bg-bg active:bg-border/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const value = thresholdType === 'rate_score'
                  ? scoreValue
                  : parseFloat(rateValue);
                if (!isNaN(value) && value > 0) {
                  onSave({ thresholdType, thresholdValue: value, notifyOnce });
                }
              }}
              className="flex-1 px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 active:scale-[0.98] transition-all duration-150"
            >
              Create Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
