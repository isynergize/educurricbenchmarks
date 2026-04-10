# Higher Ed Curriculum Benchmarks

A data dashboard for higher education executives to identify growing career fields and motivate new program creation at universities. Combines IPEDS completions data with BLS labor demand data to surface supply-demand gaps by program area.

## Stack

- **Runtime:** Bun
- **Framework:** Next.js (App Router)
- **Database:** SQLite via `better-sqlite3`
- **UI:** React, Tailwind CSS, Recharts
- **Language:** TypeScript

---

## Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Seed the database

Initializes the SQLite database with schema and realistic sample data based on actual IPEDS/BLS baselines (2019–2023).

```bash
bun run setup-db
```

### 3. Start the dev server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## Data Ingestion (Live Data)

When you're ready to replace seed data with live API data:

```bash
# Fetch IPEDS completions for a given year (via Urban Institute Education Data API)
bun run ingest-ipeds 2023

# Fetch BLS OEWS employment data for a given year
bun run ingest-bls 2023
```

Set `BLS_API_KEY` in your environment for higher BLS API rate limits (free registration at bls.gov).

---

## Project Structure

```
app/
  api/
    dashboard/route.ts      # Gap analysis, occupations, completions, stats, scoring
    filters/route.ts        # Filter options (states, years, inst types, institutions)
    benchmarking/route.ts   # Institution vs. state/peer program mix
  page.tsx                  # Server component — fetches initial data
  layout.tsx

components/
  Dashboard.tsx             # Main client component, manages filter state
  FilterBar.tsx             # State / institution type / year range filters
  StatCard.tsx              # Summary metric cards
  GrowthChart.tsx           # Employment growth bar chart (BLS)
  CompletionsChart.tsx      # Completions trend lines (IPEDS)
  GapTable.tsx              # CIP-SOC gap analysis table (weighted gap + demand score)
  OpportunityScore.tsx      # Top new program candidates ranked 0–100
  BenchmarkPanel.tsx        # Institution vs. state avg and peer institutions

lib/
  db.ts                     # better-sqlite3 singleton + schema initialization
  seed.ts                   # Seed data (IPEDS/BLS baselines, CIP-SOC crosswalk)
  types.ts                  # Shared TypeScript interfaces

scripts/
  setup-db.ts               # One-time DB init + seed (run with tsx via Node)
  ingest-ipeds.ts           # Live IPEDS data ingestion
  ingest-bls.ts             # Live BLS OEWS data ingestion

data/
  educurric.db              # SQLite database (git-ignored)
```

---

## Phase 1 — Completed

**Goal:** Functional data pipeline and core executive dashboard.

- [x] Next.js + Bun project scaffold with Tailwind CSS and TypeScript
- [x] SQLite schema — `ipeds_completions`, `bls_employment`, `cip_soc_crosswalk`
- [x] Seed data — 10 CIP codes, 10 SOC codes, 10 states, 5 years (2019–2023), realistic growth rates
- [x] CIP-to-SOC crosswalk embedded (subset of official NCES/BLS crosswalk)
- [x] IPEDS ingestion script — Urban Institute Education Data API, postsecondary only
- [x] BLS OEWS ingestion script — BLS public API v2, by state and SOC code
- [x] Dashboard API routes — gap analysis, top occupations, completion trends, summary stats
- [x] Gap analysis engine — compares employment growth rate to completions growth rate per CIP-SOC pair
- [x] Core dashboard UI — stat cards, growth chart, completions trend chart, gap table
- [x] Filter controls — state, institution type (2yr/4yr), year range; all wired to live API

---

## Phase 2 — Completed

**Goal:** Analytical depth and executive-grade insights.

- [x] Gap analysis enhancements — weighted gap score (raw gap × wage premium vs. $90k baseline); demand score (employment growth × volume); expanded table columns and status badges
- [x] Program opportunity scoring — composite 0–100 rank (40% weighted gap + 30% wage + 30% demand size); top 10 candidates with per-component mini bar charts
- [x] Benchmarking — institution vs. state average and same-state/same-type peer institutions; grouped bar chart + detail table with % diff vs. peers; respects year filters

---

## Deprioritized (not yet planned)

- Trend sparklines — year-over-year with annotated inflection points
- Geographic views — state/metro maps of demand vs. nearby supply
- Export and reporting — PDF/CSV for board presentations
- Authentication — role-based access for personalized executive views

---

## Key Constraints

- **Higher education only** — all IPEDS queries are filtered to postsecondary institutions (sector 1–6). No K-12 data.
- **Gap score definition:** `employment_growth_% - completions_growth_%` over the selected year range. Positive = demand outpacing supply.
- **Weighted gap score:** raw gap × wage premium multiplier (wage / $90k baseline). Amplifies gaps in high-wage fields.
- **Demand score:** `employment_growth_% × avg_employment`. Weights growth by market size.
- **Opportunity score:** composite 0–100 across weighted gap (40%), wage level (30%), and demand size (30%).
