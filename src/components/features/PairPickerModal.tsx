'use client';

import { useState } from 'react';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { getCurrencyInfo, CURRENCY_FALLBACK } from '@/lib/api/countries';
import { cn } from '@/lib/utils';

interface PairPickerModalProps {
  defaultHomeCurrency?: string;
  onComplete: (homeCurrency: string, targetCurrencies: string[]) => void;
  onClose: () => void;
}

const POPULAR_TARGETS = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];

export function PairPickerModal({ defaultHomeCurrency = 'USD', onComplete, onClose }: PairPickerModalProps) {
  const [homeCurrency, setHomeCurrency] = useState(defaultHomeCurrency);
  const [selected, setSelected] = useState<string[]>([]);

  function toggleCurrency(code: string) {
    setSelected(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : prev.length < 10 ? [...prev, code] : prev
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="picker-modal-title" onClick={onClose}>
      <div
        className="bg-surface rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 id="picker-modal-title" className="font-heading font-bold text-xl text-text-primary mb-1">Track Your Currencies</h2>
          <p className="text-sm text-text-secondary mb-5">Choose your home currency and select the currencies you deal with.</p>

          <div className="mb-5">
            <CurrencyPicker
              value={homeCurrency}
              onChange={setHomeCurrency}
              label="Your home currency"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Currencies you deal with {selected.length > 0 && `(${selected.length} selected)`}
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {POPULAR_TARGETS.filter(c => c !== homeCurrency).map(code => {
                const info = getCurrencyInfo(code);
                const isSelected = selected.includes(code);
                return (
                  <button
                    key={code}
                    onClick={() => toggleCurrency(code)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all duration-150 active:scale-95',
                      isSelected
                        ? 'bg-accent text-white border-accent shadow-sm'
                        : 'bg-surface border-border text-text-primary hover:border-accent/40 hover:bg-accent/[0.03]'
                    )}
                  >
                    <span>{info.flag}</span>
                    <span className="font-data">{code}</span>
                  </button>
                );
              })}
            </div>

            {/* All currencies */}
            <details className="mt-2">
              <summary className="text-sm text-accent cursor-pointer hover:underline">
                Show all currencies
              </summary>
              <div className="grid grid-cols-3 gap-1 mt-2 max-h-40 overflow-y-auto">
                {Object.keys(CURRENCY_FALLBACK)
                  .filter(c => c !== homeCurrency && !POPULAR_TARGETS.includes(c))
                  .map(code => {
                    const info = getCurrencyInfo(code);
                    const isSelected = selected.includes(code);
                    return (
                      <button
                        key={code}
                        onClick={() => toggleCurrency(code)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors text-left',
                          isSelected
                            ? 'bg-accent/10 text-accent'
                            : 'hover:bg-bg text-text-primary'
                        )}
                      >
                        <span>{info.flag}</span>
                        <span className="font-data">{code}</span>
                      </button>
                    );
                  })}
              </div>
            </details>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:bg-bg active:bg-border/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selected.length > 0) {
                  onComplete(homeCurrency, selected);
                }
              }}
              disabled={selected.length === 0}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                selected.length > 0
                  ? 'bg-accent text-white hover:bg-accent/90 active:scale-[0.98]'
                  : 'bg-border text-text-secondary cursor-not-allowed'
              )}
            >
              Start Tracking ({selected.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
