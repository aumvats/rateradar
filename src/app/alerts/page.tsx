'use client';

import { useState } from 'react';
import { getCurrencyInfo } from '@/lib/api/countries';
import type { Alert } from '@/types';

// For v1, alerts require auth which requires Supabase config.
// This page shows a placeholder for unauthenticated users and
// will display alerts when Supabase is configured.

export default function AlertsPage() {
  const [alerts] = useState<Alert[]>([]);

  // For now, show the unauthenticated state since Supabase keys
  // are not configured by default
  const isAuthenticated = false;

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 bg-accent/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" />
            <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-heading font-bold text-xl text-text-primary mb-2">Rate Alerts</h1>
        <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
          Get notified when exchange rates reach your target. Sign in with Google to create and manage alerts.
        </p>
        <button className="px-5 py-2.5 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent/90 active:scale-[0.97] transition-all duration-150 shadow-sm">
          Sign in with Google
        </button>
        <p className="text-xs text-text-secondary mt-3">
          Free plan includes 1 alert. Upgrade to Pro for 20.
        </p>
      </div>
    );
  }

  // Empty state for authenticated users with no alerts
  if (alerts.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 bg-accent/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" />
            <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-heading font-bold text-xl text-text-primary mb-2">No Alerts Yet</h1>
        <p className="text-text-secondary text-sm mb-6">
          Create your first alert from any currency pair card on the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Your Alerts</h1>

      <div className="space-y-3">
        {alerts.map(alert => {
          const fromInfo = getCurrencyInfo(alert.fromCurrency);
          const toInfo = getCurrencyInfo(alert.toCurrency);

          return (
            <div
              key={alert.id}
              className="bg-surface border border-border rounded-lg p-4 flex items-center gap-4 hover:border-accent/30 transition-colors duration-150"
            >
              <div className="flex items-center gap-1 text-lg">
                <span>{fromInfo.flag}</span>
                <span>{toInfo.flag}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-text-primary">
                  {alert.fromCurrency}/{alert.toCurrency}
                </p>
                <p className="text-xs text-text-secondary">
                  {alert.thresholdType === 'rate_score'
                    ? `Rate Score above ${alert.thresholdValue}`
                    : `Rate reaches ${alert.thresholdValue}`}
                  {alert.notifyOnce ? ' (once)' : ' (recurring)'}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                alert.active ? 'bg-success/10 text-success' : 'bg-border text-text-secondary'
              }`}>
                {alert.active ? 'Active' : 'Triggered'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
