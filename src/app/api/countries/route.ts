import { NextResponse } from 'next/server';
import { CURRENCY_FALLBACK } from '@/lib/api/countries';

export async function GET() {
  try {
    const res = await fetch(
      'https://restcountries.com/v3.1/all?fields=currencies,flags,name',
      { next: { revalidate: 86400 } } // 24-hour cache
    );

    if (!res.ok) {
      return NextResponse.json(CURRENCY_FALLBACK);
    }

    const countries = await res.json();
    const currencyMap: Record<string, { flag: string; name: string; symbol: string }> = {};

    for (const country of countries) {
      if (!country.currencies) continue;
      for (const [code, info] of Object.entries(country.currencies)) {
        if (!currencyMap[code]) {
          const currencyInfo = info as { name: string; symbol: string };
          currencyMap[code] = {
            flag: country.flags?.svg ?? country.flags?.png ?? '',
            name: currencyInfo.name,
            symbol: currencyInfo.symbol ?? code,
          };
        }
      }
    }

    // Merge with fallback for missing flag emojis
    for (const [code, data] of Object.entries(CURRENCY_FALLBACK)) {
      if (!currencyMap[code]) {
        currencyMap[code] = data;
      } else if (!currencyMap[code].flag) {
        currencyMap[code].flag = data.flag;
      }
    }

    return NextResponse.json(currencyMap);
  } catch {
    return NextResponse.json(CURRENCY_FALLBACK);
  }
}
