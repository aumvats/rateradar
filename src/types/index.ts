export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export interface CurrencyPair {
  from: string;
  to: string;
}

export interface RateData {
  pair: CurrencyPair;
  currentRate: number;
  previousRate: number;
  dailyChange: number;
  rateScore: number;
  sparklineData: number[];
  timestamp: string;
}

export interface TimeSeriesPoint {
  date: string;
  rate: number;
}

export interface TimeSeries {
  pair: CurrencyPair;
  data: TimeSeriesPoint[];
  startDate: string;
  endDate: string;
}

export interface PairStats {
  min: number;
  max: number;
  avg: number;
  current: number;
  percentile: number;
  volatility: number;
  dailyChange: number;
}

export interface Alert {
  id: string;
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  thresholdType: 'rate_score' | 'exchange_rate';
  thresholdValue: number;
  notifyOnce: boolean;
  active: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
}

export interface UserPreferences {
  homeCurrency: string;
  plan: 'free' | 'pro';
}

export interface CountryData {
  flag: string;
  name: string;
  symbol: string;
}
