import { getCountryData, setCountryData } from '@/lib/storage';
import type { CountryData } from '@/types';

export const CURRENCY_FALLBACK: Record<string, CountryData> = {
  USD: { flag: '\u{1F1FA}\u{1F1F8}', name: 'US Dollar', symbol: '$' },
  EUR: { flag: '\u{1F1EA}\u{1F1FA}', name: 'Euro', symbol: '\u20AC' },
  GBP: { flag: '\u{1F1EC}\u{1F1E7}', name: 'British Pound', symbol: '\u00A3' },
  JPY: { flag: '\u{1F1EF}\u{1F1F5}', name: 'Japanese Yen', symbol: '\u00A5' },
  CAD: { flag: '\u{1F1E8}\u{1F1E6}', name: 'Canadian Dollar', symbol: '$' },
  AUD: { flag: '\u{1F1E6}\u{1F1FA}', name: 'Australian Dollar', symbol: '$' },
  CHF: { flag: '\u{1F1E8}\u{1F1ED}', name: 'Swiss Franc', symbol: 'Fr' },
  CNY: { flag: '\u{1F1E8}\u{1F1F3}', name: 'Chinese Yuan', symbol: '\u00A5' },
  INR: { flag: '\u{1F1EE}\u{1F1F3}', name: 'Indian Rupee', symbol: '\u20B9' },
  MXN: { flag: '\u{1F1F2}\u{1F1FD}', name: 'Mexican Peso', symbol: '$' },
  SGD: { flag: '\u{1F1F8}\u{1F1EC}', name: 'Singapore Dollar', symbol: '$' },
  HKD: { flag: '\u{1F1ED}\u{1F1F0}', name: 'Hong Kong Dollar', symbol: '$' },
  NOK: { flag: '\u{1F1F3}\u{1F1F4}', name: 'Norwegian Krone', symbol: 'kr' },
  SEK: { flag: '\u{1F1F8}\u{1F1EA}', name: 'Swedish Krona', symbol: 'kr' },
  DKK: { flag: '\u{1F1E9}\u{1F1F0}', name: 'Danish Krone', symbol: 'kr' },
  NZD: { flag: '\u{1F1F3}\u{1F1FF}', name: 'New Zealand Dollar', symbol: '$' },
  BRL: { flag: '\u{1F1E7}\u{1F1F7}', name: 'Brazilian Real', symbol: 'R$' },
  ZAR: { flag: '\u{1F1FF}\u{1F1E6}', name: 'South African Rand', symbol: 'R' },
  KRW: { flag: '\u{1F1F0}\u{1F1F7}', name: 'South Korean Won', symbol: '\u20A9' },
  THB: { flag: '\u{1F1F9}\u{1F1ED}', name: 'Thai Baht', symbol: '\u0E3F' },
  PLN: { flag: '\u{1F1F5}\u{1F1F1}', name: 'Polish Zloty', symbol: 'z\u0142' },
  CZK: { flag: '\u{1F1E8}\u{1F1FF}', name: 'Czech Koruna', symbol: 'K\u010D' },
  HUF: { flag: '\u{1F1ED}\u{1F1FA}', name: 'Hungarian Forint', symbol: 'Ft' },
  RON: { flag: '\u{1F1F7}\u{1F1F4}', name: 'Romanian Leu', symbol: 'lei' },
  TRY: { flag: '\u{1F1F9}\u{1F1F7}', name: 'Turkish Lira', symbol: '\u20BA' },
  AED: { flag: '\u{1F1E6}\u{1F1EA}', name: 'UAE Dirham', symbol: 'AED' },
  SAR: { flag: '\u{1F1F8}\u{1F1E6}', name: 'Saudi Riyal', symbol: 'SAR' },
  PHP: { flag: '\u{1F1F5}\u{1F1ED}', name: 'Philippine Peso', symbol: '\u20B1' },
  IDR: { flag: '\u{1F1EE}\u{1F1E9}', name: 'Indonesian Rupiah', symbol: 'Rp' },
  MYR: { flag: '\u{1F1F2}\u{1F1FE}', name: 'Malaysian Ringgit', symbol: 'RM' },
};

export function getCurrencyInfo(code: string): CountryData {
  const cached = getCountryData();
  if (cached && cached[code]) return cached[code];
  return CURRENCY_FALLBACK[code] ?? { flag: '', name: code, symbol: code };
}

export async function fetchAndCacheCurrencyMetadata(): Promise<Record<string, CountryData>> {
  const cached = getCountryData();
  if (cached) return cached;

  try {
    const res = await fetch('/api/countries');
    if (!res.ok) return CURRENCY_FALLBACK;
    const data: Record<string, CountryData> = await res.json();
    setCountryData(data);
    return data;
  } catch {
    return CURRENCY_FALLBACK;
  }
}

export function getAllCurrencies(): { code: string; name: string; flag: string; symbol: string }[] {
  const data = getCountryData() ?? CURRENCY_FALLBACK;
  return Object.entries(data).map(([code, info]) => ({
    code,
    ...info,
  })).sort((a, b) => a.code.localeCompare(b.code));
}
