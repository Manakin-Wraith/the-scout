# Scout - Talent Management Platform

A comprehensive talent scouting and campaign management platform for influencer marketing.

## Features

- **Dashboard** - Real-time stats, top earners, talent funnel, and geographic distribution
- **Discovery** - Scout 35,000+ prospects with quality scores and rankings
- **Talent Roster** - Manage active deal takers and their performance
- **Hidden Inventory** - Identify dormant influencers with high potential
- **Lead Acquisition** - Track and engage non-interacting leads
- **Whale Hunter** - Find high-quality candidates with verified profiles
- **Risk Radar** - Assess risk levels and identify potential issues
- **Deal Analyzer** - Analyze budget efficiency and ROI
- **Campaigns** - Track campaign performance and creator participation
- **Shortlists** - Organize prospects into custom lists

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Icons**: Lucide React

## Run Locally

**Prerequisites:** Node.js 18+

1. Clone the repository:
   ```bash
   git clone https://github.com/Manakin-Wraith/the-scout.git
   cd the-scout
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` from the example:
   ```bash
   cp .env.example .env.local
   ```

4. Add your Supabase credentials to `.env.local`:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Manakin-Wraith/the-scout)

### Option 2: Manual Deploy

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `GEMINI_API_KEY` | Google Gemini API key (for AI features) | No |

## Database Schema

The app uses Supabase with the following main tables:
- `users` - Unified identity table
- `deal_takers` - Campaign participants
- `dormant_influencers` - Potential recruits
- `non_interactors` - Leads who didn't engage
- `infofi_profiles` - Quality/risk data
- `shortlists` / `shortlist_items` - User-created lists

Key views:
- `scouting_prospects` - Main discovery view with scout_score
- `enriched_deal_takers` - Deal takers with risk assessment
- `whale_candidates` - High-quality verified prospects
- `prospects_by_location` - Geographic stats

## License

MIT
