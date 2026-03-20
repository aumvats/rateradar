'use client';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 80, height = 32 }: SparklineProps) {
  if (data.length < 2) return null;

  const min = data.reduce((a, b) => Math.min(a, b), Infinity);
  const max = data.reduce((a, b) => Math.max(a, b), -Infinity);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padding + ((max - value) / range) * (height - 2 * padding);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0" role="img" aria-label="30-day rate trend">
      <path d={areaPath} fill="#2563EB" fillOpacity={0.05} />
      <path d={linePath} fill="none" stroke="#2563EB" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
