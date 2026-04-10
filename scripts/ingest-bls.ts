/**
 * BLS OEWS (Occupational Employment and Wage Statistics) ingestion.
 * Fetches national and state-level employment data by SOC code.
 *
 * Usage: bun run ingest-bls [year]
 * API docs: https://www.bls.gov/developers/api_signature_v2.htm
 *
 * Set BLS_API_KEY env var for higher rate limits (free registration at bls.gov).
 */
import { getDb } from "../lib/db";

const BLS_API = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
const API_KEY = process.env.BLS_API_KEY ?? "";
const TARGET_YEAR = parseInt(process.argv[2] ?? "2023");

// OEWS series format: OEU{state_fips}{soc_nodash}3 (employment), suffix 4 = mean wage
// National series: OEU0000000{soc_nodash}3
const SOC_CODES = [
  "15-1252", "15-1211", "17-2061", "29-1141",
  "11-1021", "13-2011", "15-2041", "15-2051",
  "15-1232", "25-2021",
];

// State FIPS for our tracked states
const STATE_FIPS: Record<string, string> = {
  CA: "06", TX: "48", NY: "36", FL: "12", WA: "53",
  IL: "17", PA: "42", OH: "39", GA: "13", MA: "25",
};

function seriesId(fips: string, soc: string, datatype: "employment" | "wage"): string {
  const socClean = soc.replace("-", "");
  const suffix = datatype === "employment" ? "03" : "11"; // OEWS data type codes
  return `OEUS${fips}000000${socClean}${suffix}`;
}

async function fetchSeries(seriesIds: string[], year: number) {
  const body = {
    seriesid: seriesIds,
    startyear: String(year),
    endyear: String(year),
    ...(API_KEY ? { registrationkey: API_KEY } : {}),
  };
  const resp = await fetch(BLS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`BLS API error: ${resp.status}`);
  const json = await resp.json() as { Results?: { series: { seriesID: string; data: { year: string; value: string }[] }[] } };
  return json.Results?.series ?? [];
}

async function ingestYear(year: number) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO bls_employment (year, state, soc_code, soc_title, employment, mean_wage)
    VALUES ($year, $state, $soc_code, $soc_title, $employment, $mean_wage)
  `);

  for (const [state, fips] of Object.entries(STATE_FIPS)) {
    const empIds = SOC_CODES.map((s) => seriesId(fips, s, "employment"));
    const wageIds = SOC_CODES.map((s) => seriesId(fips, s, "wage"));

    const [empSeries, wageSeries] = await Promise.all([
      fetchSeries(empIds, year),
      fetchSeries(wageIds, year),
    ]);

    const wageMap = new Map(wageSeries.map((s) => [s.seriesID, s.data[0]?.value ?? "0"]));

    for (let i = 0; i < SOC_CODES.length; i++) {
      const soc_code = SOC_CODES[i];
      const empData = empSeries[i];
      if (!empData?.data[0]) continue;

      const employment = parseInt(empData.data[0].value.replace(",", "")) * 1000; // OEWS reports in thousands
      const mean_wage = parseInt(wageMap.get(wageIds[i]) ?? "0");

      insert.run({
        $year: year,
        $state: state,
        $soc_code: soc_code,
        $soc_title: soc_code, // Update with real titles via crosswalk lookup
        $employment: employment,
        $mean_wage: mean_wage,
      });
    }

    console.log(`Ingested ${state} employment data for ${year}.`);
  }
}

await ingestYear(TARGET_YEAR);
