import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CalculatorForm } from '@/components/features/CalculatorForm';

export const metadata: Metadata = {
  title: 'Currency Calculator',
  description:
    'Convert between currencies and see how today\'s rate compares to the past year with the RateRadar Rate Score.',
};

export default function CalculatorPage() {
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-heading font-bold text-[28px] text-text-primary mb-2">
        Currency Calculator
      </h1>
      <p className="text-[15px] text-text-secondary mb-6 leading-relaxed">
        Convert between currencies and see how today&apos;s rate compares to the past year.
      </p>
      <Suspense fallback={<div className="animate-pulse bg-border rounded-lg h-64" />}>
        <CalculatorForm />
      </Suspense>
    </div>
  );
}
