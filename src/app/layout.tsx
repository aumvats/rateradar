import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import { DashboardHeader } from '@/components/features/DashboardHeader';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'RateRadar — Currency Rate Monitoring Dashboard',
    template: '%s | RateRadar',
  },
  description:
    'See a simple 0-100 favorability score for every currency pair you care about. Know when exchange rates are favorable for your business.',
  keywords: [
    'exchange rate',
    'currency monitoring',
    'rate score',
    'forex dashboard',
    'currency converter',
    'exchange rate alerts',
    'small business forex',
  ],
  openGraph: {
    title: 'RateRadar',
    description:
      'A currency monitoring dashboard that gives small businesses a 0-100 favorability score for every exchange rate.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RateRadar',
    description:
      'A currency monitoring dashboard that gives small businesses a 0-100 favorability score for every exchange rate.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-bg font-body text-text-primary antialiased">
        <ToastProvider>
          <DashboardHeader />
          <main className="flex-1">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
