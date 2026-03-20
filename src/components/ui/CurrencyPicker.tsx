'use client';

import { useState, useRef, useEffect } from 'react';
import { getCurrencyInfo, CURRENCY_FALLBACK } from '@/lib/api/countries';
import { cn } from '@/lib/utils';

interface CurrencyPickerProps {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  excludeCodes?: string[];
}

const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_FALLBACK);

export function CurrencyPicker({ value, onChange, label, excludeCodes = [] }: CurrencyPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = SUPPORTED_CURRENCIES
    .filter(code => !excludeCodes.includes(code))
    .filter(code => {
      if (!search) return true;
      const info = getCurrencyInfo(code);
      const q = search.toLowerCase();
      return code.toLowerCase().includes(q) || info.name.toLowerCase().includes(q);
    });

  const selectedInfo = getCurrencyInfo(value);

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-md text-left text-text-primary hover:border-accent transition-colors"
      >
        <span className="text-lg">{selectedInfo.flag}</span>
        <span className="font-data font-medium">{value}</span>
        <span className="text-text-secondary text-sm truncate">{selectedInfo.name}</span>
        <svg className="ml-auto w-4 h-4 text-text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search currencies..."
              className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-bg focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.map(code => {
              const info = getCurrencyInfo(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => { onChange(code); setOpen(false); setSearch(''); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg transition-colors text-sm',
                    code === value && 'bg-accent/5 text-accent'
                  )}
                >
                  <span className="text-lg">{info.flag}</span>
                  <span className="font-data font-medium">{code}</span>
                  <span className="text-text-secondary truncate">{info.name}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-text-secondary text-center">No currencies found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
