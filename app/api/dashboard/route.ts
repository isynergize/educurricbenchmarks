import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import type { DashboardData, GapRow, OccupationRow, CompletionTrend, ScoringRow } from "@/lib/types";

function computeScoring(rows: GapRow[]): ScoringRow[] {
  if (rows.length === 0) return [];
  const wgaps   = rows.map(r => r.weightedGapScore);
  const wages   = rows.map(r => r.avgWage);
  const demands = rows.map(r => r.demandScore);
  const minWgap = Math.min(...wgaps),   maxWgap = Math.max(...wgaps);
  const minWage = Math.min(...wages),   maxWage = Math.max(...wages);
  const minDem  = Math.min(...demands), maxDem  = Math.max(...demands);
  const norm = (v: number, mn: number, mx: number) =>
    mx === mn ? 50 : Math.round((v - mn) / (mx - mn) * 100);
  return rows
    .map(r => {
      const wgapComponent   = norm(r.weightedGapScore, minWgap, maxWgap);
      const wageComponent   = norm(r.avgWage,          minWage, maxWage);
      const demandComponent = norm(r.demandScore,      minDem,  maxDem);
      return {
        cipCode: r.cipCode, cipTitle: r.cipTitle,
        socCode: r.socCode, socTitle: r.socTitle,
        avgWage: r.avgWage,
        gapScore: r.gapScore,
        weightedGapScore: r.weightedGapScore,
        demandScore: r.demandScore,
        opportunityScore: Math.round(0.4 * wgapComponent + 0.3 * wageComponent + 0.3 * demandComponent),
        wgapComponent, wageComponent, demandComponent,
      };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDb();
  seedDatabase(db);

  const { searchParams } = req.nextUrl;
  const state     = searchParams.get("state")     ?? null;
  const instType  = searchParams.get("instType")  ?? null;
  const yearStart = parseInt(searchParams.get("yearStart") ?? "2019");
  const yearEnd   = parseInt(searchParams.get("yearEnd")   ?? "2023");

  const completionsWhere = () => {
    const parts = [`year BETWEEN ${yearStart} AND ${yearEnd}`];
    if (state)    parts.push(`state = '${state.replace(/'/g, "''")}'`);
    if (instType) parts.push(`inst_type = '${instType.replace(/'/g, "''")}'`);
    return parts.join(" AND ");
  };

  const employmentWhere = () => {
    const parts = [`year BETWEEN ${yearStart} AND ${yearEnd}`];
    if (state) parts.push(`state = '${state.replace(/'/g, "''")}'`);
    return parts.join(" AND ");
  };

  // ── Gap Analysis ──────────────────────────────────────────────────────────
  const gapRows = db.prepare(`
    WITH comp_by_year AS (
      SELECT cip_code, year, SUM(completions) AS completions
      FROM   ipeds_completions
      WHERE  ${completionsWhere()}
      GROUP  BY cip_code, year
    ),
    comp_agg AS (
      SELECT
        cip_code,
        SUM(completions)                                                   AS total_completions,
        ROUND(100.0 * (MAX(completions) - MIN(completions))
              / NULLIF(MIN(completions), 0), 1)                            AS completions_growth
      FROM comp_by_year
      GROUP BY cip_code
    ),
    emp_by_year AS (
      SELECT soc_code, year, SUM(employment) AS employment, AVG(mean_wage) AS mean_wage
      FROM   bls_employment
      WHERE  ${employmentWhere()}
      GROUP  BY soc_code, year
    ),
    emp_agg AS (
      SELECT
        soc_code,
        ROUND(AVG(employment))                                             AS avg_employment,
        ROUND(AVG(mean_wage))                                              AS avg_wage,
        ROUND(100.0 * (MAX(employment) - MIN(employment))
              / NULLIF(MIN(employment), 0), 1)                             AS employment_growth
      FROM emp_by_year
      GROUP BY soc_code
    )
    SELECT
      cs.cip_code   AS cipCode,
      cs.cip_title  AS cipTitle,
      cs.soc_code   AS socCode,
      cs.soc_title  AS socTitle,
      COALESCE(ca.total_completions,  0) AS totalCompletions,
      COALESCE(ea.avg_employment,     0) AS avgEmployment,
      COALESCE(ea.avg_wage,           0) AS avgWage,
      COALESCE(ca.completions_growth, 0) AS completionsGrowth,
      COALESCE(ea.employment_growth,  0) AS employmentGrowth,
      ROUND(COALESCE(ea.employment_growth, 0)
            - COALESCE(ca.completions_growth, 0), 1) AS gapScore,
      ROUND((COALESCE(ea.employment_growth, 0) - COALESCE(ca.completions_growth, 0))
            * COALESCE(ea.avg_wage, 0) / 90000.0, 1) AS weightedGapScore,
      ROUND(COALESCE(ea.employment_growth, 0)
            * COALESCE(ea.avg_employment, 0) / 100000.0, 1) AS demandScore
    FROM  cip_soc_crosswalk cs
    LEFT  JOIN comp_agg ca ON ca.cip_code = cs.cip_code
    LEFT  JOIN emp_agg  ea ON ea.soc_code  = cs.soc_code
    ORDER BY weightedGapScore DESC
  `).all() as GapRow[];

  // ── Top Occupations by Employment Growth ─────────────────────────────────
  const topOccupations = db.prepare(`
    SELECT
      soc_code  AS socCode,
      soc_title AS socTitle,
      ROUND(AVG(employment))  AS employment,
      ROUND(AVG(mean_wage))   AS meanWage,
      ROUND(100.0 * (MAX(employment) - MIN(employment))
            / NULLIF(MIN(employment), 0), 1) AS growthRate
    FROM (
      SELECT soc_code, soc_title, year, SUM(employment) AS employment, AVG(mean_wage) AS mean_wage
      FROM   bls_employment
      WHERE  ${employmentWhere()}
      GROUP  BY soc_code, year
    )
    GROUP BY soc_code
    ORDER BY growthRate DESC
    LIMIT 10
  `).all() as OccupationRow[];

  // ── Completion Trends (top 6 programs by volume) ─────────────────────────
  const completionTrends = db.prepare(`
    SELECT cip_title AS cipTitle, year, SUM(completions) AS completions
    FROM   ipeds_completions
    WHERE  ${completionsWhere()}
      AND  cip_code IN (
        SELECT cip_code
        FROM   ipeds_completions
        WHERE  ${completionsWhere()}
        GROUP  BY cip_code
        ORDER  BY SUM(completions) DESC
        LIMIT  6
      )
    GROUP BY cip_code, year
    ORDER BY year, completions DESC
  `).all() as CompletionTrend[];

  // ── Summary Stats ─────────────────────────────────────────────────────────
  const { total_completions } = db.prepare(`
    SELECT SUM(completions) AS total_completions
    FROM   ipeds_completions
    WHERE  ${completionsWhere()}
  `).get() as { total_completions: number };

  const { avg_wage } = db.prepare(`
    SELECT ROUND(AVG(mean_wage)) AS avg_wage
    FROM   bls_employment
    WHERE  ${employmentWhere()}
  `).get() as { avg_wage: number };

  const gapCount = gapRows.filter((r) => r.weightedGapScore > 10).length;
  const scoring  = computeScoring(gapRows);

  const data: DashboardData = {
    stats: {
      totalCompletions: total_completions ?? 0,
      totalOccupations: topOccupations.length,
      avgWage: avg_wage ?? 0,
      gapCount,
    },
    gapAnalysis: gapRows,
    topOccupations,
    completionTrends,
    scoring,
  };

  return NextResponse.json(data);
}
