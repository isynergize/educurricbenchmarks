/**
 * IPEDS Completions ingestion via Urban Institute Education Data API.
 * Fetches postsecondary completions by CIP code and institution.
 *
 * Usage: bun run ingest-ipeds [year]
 * API docs: https://educationdata.urban.org/documentation/colleges.html
 *
 * This script replaces seed data with live IPEDS data for a given year.
 * Run `bun run setup-db` first to create the schema.
 */
// @ts-ignore - bun script, runs directly via bun CLI
import { getDb } from "../lib/db";

const BASE_URL = "https://educationdata.urban.org/api/v1/college-university/ipeds/completions-cip";

const TARGET_YEAR = parseInt(process.argv[2] ?? "2022");

async function fetchPage(url: string) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`IPEDS API error: ${resp.status} ${resp.statusText}`);
  return resp.json() as Promise<{ results: unknown[]; next: string | null }>;
}

async function ingestYear(year: number) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO ipeds_completions (year, state, inst_type, cip_code, cip_title, completions)
    VALUES ($year, $state, $inst_type, $cip_code, $cip_title, $completions)
  `);

  // Filter to postsecondary (sector 1–6 = 4yr/2yr public+private; exclude sector 0 = admin)
  let url: string | null =
    `${BASE_URL}/?year=${year}&level_of_study=1&page_size=1000`;
  let total = 0;

  while (url) {
    const data = await fetchPage(url);
    for (const row of data.results as Record<string, unknown>[]) {
      // sector: 1-3 = 4yr, 4-6 = 2yr
      const sector = Number(row.sector ?? 0);
      if (sector === 0) continue;
      const inst_type = sector <= 3 ? "4yr" : "2yr";

      insert.run({
        $year: year,
        $state: String(row.state_abbr ?? "US"),
        $inst_type: inst_type,
        $cip_code: String(row.cipcode ?? ""),
        $cip_title: String(row.ciptitle ?? ""),
        $completions: Number(row.ctotalt ?? 0),
      });
      total++;
    }
    url = data.next ?? null;
    process.stdout.write(`\rIngested ${total} rows...`);
  }

  console.log(`\nIPEDS ${year}: ingested ${total} completions rows.`);
}

await ingestYear(TARGET_YEAR);
