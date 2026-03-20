import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get('from') ?? 'USD';
  const to = searchParams.get('to') ?? 'EUR';
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json(
      { error: 'start and end date params required' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.frankfurter.app/${encodeURIComponent(start)}..${encodeURIComponent(end)}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch time series' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Rate service unavailable' },
      { status: 503 }
    );
  }
}
