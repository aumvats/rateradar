import type { TimeSeriesPoint } from '@/types';

export async function getCurrentRates(
  from: string,
  to: string[]
): Promise<Record<string, number>> {
  try {
    const res = await fetch(`/api/rates?from=${from}&to=${to.join(',')}`);
    if (!res.ok) throw new Error(`Frankfurter error: ${res.status}`);
    const data = await res.json();
    return data.rates ?? {};
  } catch (error) {
    // Try backup API
    return getBackupRates(from, to);
  }
}

async function getBackupRates(
  from: string,
  to: string[]
): Promise<Record<string, number>> {
  try {
    const res = await fetch(`/api/rates-backup?from=${from}`);
    if (!res.ok) throw new Error(`Backup API error: ${res.status}`);
    const data = await res.json();
    const rates: Record<string, number> = {};
    for (const currency of to) {
      if (data[currency.toLowerCase()] !== undefined) {
        rates[currency] = data[currency.toLowerCase()];
      }
    }
    return rates;
  } catch {
    return {};
  }
}

export async function getTimeSeries(
  from: string,
  to: string,
  startDate: string,
  endDate: string
): Promise<TimeSeriesPoint[]> {
  try {
    const res = await fetch(
      `/api/timeseries?from=${from}&to=${to}&start=${startDate}&end=${endDate}`
    );
    if (!res.ok) throw new Error(`Timeseries error: ${res.status}`);
    const data = await res.json();

    if (!data.rates) return [];

    return Object.entries(data.rates).map(([date, rates]) => ({
      date,
      rate: (rates as Record<string, number>)[to] ?? 0,
    }));
  } catch {
    return [];
  }
}
