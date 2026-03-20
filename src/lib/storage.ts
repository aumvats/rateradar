const PREFIX = 'rateradar_';

function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

// Tracked currency pairs (target currencies relative to home currency)
export function getTrackedPairs(): string[] {
  return getItem<string[]>('pairs') ?? [];
}

export function setTrackedPairs(pairs: string[]): void {
  setItem('pairs', pairs);
}

// Home currency
export function getHomeCurrency(): string {
  return getItem<string>('home_currency') ?? 'USD';
}

export function setHomeCurrency(currency: string): void {
  setItem('home_currency', currency);
}

// Cached rates with TTL
interface CachedData<T> {
  data: T;
  expiry: number;
}

export function getCached<T>(key: string): T | null {
  const cached = getItem<CachedData<T>>('cache_' + key);
  if (!cached) return null;
  if (Date.now() > cached.expiry) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PREFIX + 'cache_' + key);
    }
    return null;
  }
  return cached.data;
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  setItem<CachedData<T>>('cache_' + key, {
    data,
    expiry: Date.now() + ttlMs,
  });
}

// Session cache (sessionStorage) for time series data
export function getSessionCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const cached: CachedData<T> = JSON.parse(raw);
    if (Date.now() > cached.expiry) {
      sessionStorage.removeItem(PREFIX + key);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

export function setSessionCache<T>(key: string, data: T, ttlMs: number): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({
      data,
      expiry: Date.now() + ttlMs,
    }));
  } catch {
    // Storage full
  }
}

// Country data (no expiry)
export function getCountryData(): Record<string, { flag: string; name: string; symbol: string }> | null {
  return getItem('countries');
}

export function setCountryData(data: Record<string, { flag: string; name: string; symbol: string }>): void {
  setItem('countries', data);
}
