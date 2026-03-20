import { getHomeCurrency, setHomeCurrency } from '@/lib/storage';

export async function detectHomeCurrency(): Promise<string> {
  if (typeof window === 'undefined') return 'USD';

  // Already detected in a previous session
  const existing = localStorage.getItem('rateradar_ip_detected');
  if (existing) return getHomeCurrency();

  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return 'USD';
    const data = await res.json();
    const currency = data.currency ?? 'USD';
    setHomeCurrency(currency);
    localStorage.setItem('rateradar_ip_detected', 'true');
    return currency;
  } catch {
    return 'USD';
  }
}
