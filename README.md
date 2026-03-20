# RateRadar

A currency monitoring dashboard that gives small businesses a simple 0-100 favorability score for every exchange rate they care about.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values:
   ```bash
   cp .env.example .env.local
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The app works in guest mode without any environment variables — auth, alerts, and email features require Supabase and Resend configuration.

## Environment Variables

See `.env.example` for all required variables and descriptions.

## Spec

See [PROJECT-1773814327-SPEC.md](./PROJECT-1773814327-SPEC.md) for the full product specification.
