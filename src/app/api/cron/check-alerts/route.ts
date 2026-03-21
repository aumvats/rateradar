import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Fail closed: reject requests when CRON_SECRET is not configured
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const supabase = createClient(url, key);

  // Fetch all active alerts
  const { data: alerts, error: alertError } = await supabase
    .from('rateradar_alerts')
    .select('*')
    .eq('active', true);

  if (alertError || !alerts?.length) {
    return NextResponse.json({ checked: 0 });
  }

  // Group by unique from currencies to batch API calls
  const uniqueFromCurrencies = [...new Set(alerts.map(a => a.from_currency))];
  const rateMap: Record<string, Record<string, number>> = {};

  for (const from of uniqueFromCurrencies) {
    const toCurrencies = [...new Set(
      alerts.filter(a => a.from_currency === from).map(a => a.to_currency)
    )];

    try {
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${toCurrencies.map(c => encodeURIComponent(c)).join(',')}`
      );
      if (res.ok) {
        const data = await res.json();
        rateMap[from] = data.rates ?? {};
      }
    } catch {
      // Skip this batch if fetch fails
    }
  }

  // For Rate Score alerts, fetch 365-day time series
  const scoreAlerts = alerts.filter(a => a.threshold_type === 'rate_score');
  const scoreMap: Record<string, number> = {};

  for (const alert of scoreAlerts) {
    const pairKey = `${alert.from_currency}_${alert.to_currency}`;
    if (scoreMap[pairKey] !== undefined) continue;

    const currentRate = rateMap[alert.from_currency]?.[alert.to_currency];
    if (!currentRate) continue;

    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const res = await fetch(
        `https://api.frankfurter.app/${start}..${end}?from=${encodeURIComponent(alert.from_currency)}&to=${encodeURIComponent(alert.to_currency)}`
      );
      if (res.ok) {
        const data = await res.json();
        const historicalRates = Object.values(data.rates ?? {}).map(
          (r) => (r as Record<string, number>)[alert.to_currency]
        );
        const below = historicalRates.filter(r => r <= currentRate).length;
        scoreMap[pairKey] = Math.round((below / historicalRates.length) * 100);
      }
    } catch {
      // Skip
    }
  }

  // Check each alert
  let triggered = 0;
  const resendKey = process.env.RESEND_API_KEY;

  for (const alert of alerts) {
    const currentRate = rateMap[alert.from_currency]?.[alert.to_currency];
    if (!currentRate) continue;

    let shouldTrigger = false;

    if (alert.threshold_type === 'exchange_rate') {
      shouldTrigger = currentRate >= alert.threshold_value;
    } else {
      const pairKey = `${alert.from_currency}_${alert.to_currency}`;
      const score = scoreMap[pairKey];
      if (score !== undefined) {
        shouldTrigger = score >= alert.threshold_value;
      }
    }

    if (shouldTrigger) {
      triggered++;

      // Send email via Resend if configured
      if (resendKey) {
        try {
          const { data: user } = await supabase.auth.admin.getUserById(alert.user_id);
          if (user?.user?.email) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'RateRadar <alerts@rateradar.app>',
                to: user.user.email,
                subject: `RateRadar: ${alert.from_currency}\u2192${alert.to_currency} Alert Triggered`,
                html: `<p>Your ${alert.from_currency}\u2192${alert.to_currency} alert was triggered.</p>
                       <p>Current rate: ${currentRate}</p>
                       <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/pair/${alert.from_currency.toLowerCase()}/${alert.to_currency.toLowerCase()}">View Details</a></p>`,
              }),
            });
          }
        } catch (error) {
          console.error(`[check-alerts] Email send failed for alert ${alert.id}:`, error);
        }
      }

      // Update alert
      // If this update fails, the alert stays active and may re-trigger on the next cron run
      const { error: updateError } = await supabase
        .from('rateradar_alerts')
        .update({
          last_triggered_at: new Date().toISOString(),
          ...(alert.notify_once ? { active: false } : {}),
        })
        .eq('id', alert.id);
      if (updateError) {
        console.error(`[check-alerts] Failed to update alert ${alert.id}:`, updateError.message);
      }
    }
  }

  return NextResponse.json({ checked: alerts.length, triggered });
}
