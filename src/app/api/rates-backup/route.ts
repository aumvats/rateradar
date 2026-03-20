import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from') ?? 'usd';

  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${encodeURIComponent(from.toLowerCase())}.json`,
      { next: { revalidate: 3600 } } // 1-hour cache
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Backup rate service unavailable' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data[from.toLowerCase()] ?? {});
  } catch {
    return NextResponse.json(
      { error: 'Backup rate service unavailable' },
      { status: 503 }
    );
  }
}
