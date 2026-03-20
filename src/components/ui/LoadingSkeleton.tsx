'use client';

import { cn } from '@/lib/utils';

export function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 bg-border rounded-full" />
        <div className="h-5 bg-border rounded w-24" />
      </div>
      <div className="flex items-center justify-between">
        <div className="w-16 h-16 bg-border rounded-full" />
        <div className="space-y-2">
          <div className="h-4 bg-border rounded w-16" />
          <div className="h-3 bg-border rounded w-20" />
        </div>
      </div>
      <div className="mt-4 h-8 bg-border rounded w-full" />
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={cn('h-4 bg-border rounded animate-pulse', className)} />
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-border rounded w-32 mb-4" />
      <div className="h-64 bg-border rounded w-full" />
    </div>
  );
}
