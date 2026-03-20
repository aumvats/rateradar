'use client';

import { useState, useEffect } from 'react';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { getHomeCurrency, setHomeCurrency } from '@/lib/storage';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [home, setHome] = useState('USD');
  const isAuthenticated = false;

  useEffect(() => {
    setHome(getHomeCurrency());
  }, []);

  function handleSaveHomeCurrency(code: string) {
    setHome(code);
    setHomeCurrency(code);
    showToast('Home currency updated', 'success');
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Settings</h1>

        <div className="bg-surface border border-border rounded-lg p-5 mb-6">
          <h2 className="font-heading font-semibold text-base text-text-primary mb-3">Home Currency</h2>
          <p className="text-sm text-text-secondary mb-3">
            Your base currency for all rate comparisons.
          </p>
          <CurrencyPicker value={home} onChange={handleSaveHomeCurrency} />
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 mb-6">
          <h2 className="font-heading font-semibold text-base text-text-primary mb-3">Account</h2>
          <p className="text-sm text-text-secondary mb-4">
            Sign in to sync your dashboard across devices and set rate alerts.
          </p>
          <button className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 active:scale-[0.97] transition-all duration-150 shadow-sm">
            Sign in with Google
          </button>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <h2 className="font-heading font-semibold text-base text-text-primary mb-3">Plan</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-border text-text-secondary">Free</span>
            <span className="text-sm text-text-secondary">3 pairs, 30-day history, 1 alert</span>
          </div>
          <button className="mt-3 text-sm text-accent hover:underline active:opacity-70 transition-opacity">
            Upgrade to Pro ($14/mo)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Settings</h1>

      <div className="bg-surface border border-border rounded-lg p-5 mb-6">
        <h2 className="font-heading font-semibold text-base text-text-primary mb-3">Home Currency</h2>
        <CurrencyPicker value={home} onChange={handleSaveHomeCurrency} />
      </div>

      <div className="bg-surface border border-border rounded-lg p-5 mb-6">
        <h2 className="font-heading font-semibold text-base text-text-primary mb-3">Notifications</h2>
        <p className="text-sm text-text-secondary">
          Email notifications for rate alerts are enabled by default.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-lg p-5">
        <h2 className="font-heading font-semibold text-base text-text-primary mb-3">Plan</h2>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">Pro</span>
          <span className="text-sm text-text-secondary">Unlimited pairs, 365-day history, 20 alerts</span>
        </div>
        <button className="text-sm text-error hover:underline active:opacity-70 transition-opacity">
          Sign out
        </button>
      </div>
    </div>
  );
}
