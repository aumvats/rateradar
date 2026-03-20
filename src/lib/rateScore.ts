import type { PairStats, TimeSeriesPoint } from '@/types';

export function computeRateScore(currentRate: number, historicalRates: number[]): number {
  if (historicalRates.length === 0) return 50;
  const below = historicalRates.filter(r => r <= currentRate).length;
  return Math.round((below / historicalRates.length) * 100);
}

export function computeStats(
  data: TimeSeriesPoint[],
  currentRate: number
): PairStats {
  if (data.length === 0) {
    return { min: 0, max: 0, avg: 0, current: currentRate, percentile: 50, volatility: 0, dailyChange: 0 };
  }

  const rates = data.map(d => d.rate);
  const min = rates.reduce((a, b) => Math.min(a, b), Infinity);
  const max = rates.reduce((a, b) => Math.max(a, b), -Infinity);
  const avg = rates.reduce((sum, r) => sum + r, 0) / rates.length;
  const percentile = computeRateScore(currentRate, rates);

  // Coefficient of variation (std dev / mean), expressed as a percentage
  const variance = rates.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / rates.length;
  const volatility = avg > 0 ? (Math.sqrt(variance) / avg) * 100 : 0;

  // Percentage change vs. the second-to-last data point in the series
  const previousRate = rates.length >= 2 ? rates[rates.length - 2] : rates[rates.length - 1];
  const dailyChange = previousRate > 0 ? ((currentRate - previousRate) / previousRate) * 100 : 0;

  return { min, max, avg, current: currentRate, percentile, volatility, dailyChange };
}
