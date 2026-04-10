import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import type { BenchmarkData, BenchmarkRow, Institution } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDb();
  seedDatabase(db);

  const { searchParams } = req.nextUrl;
  const institutionId = searchParams.get("institutionId");
  const yearStart     = parseInt(searchParams.get("yearStart") ?? "2019");
  const yearEnd       = parseInt(searchParams.get("yearEnd")   ?? "2023");

  if (!institutionId) {
    return NextResponse.json({ error: "institutionId required" }, { status: 400 });
  }

  const institution = db
    .prepare("SELECT id, name, city, state, inst_type AS instType FROM institutions WHERE id = ?")
    .get(institutionId) as Institution | undefined;

  if (!institution) {
    return NextResponse.json({ error: "Institution not found" }, { status: 404 });
  }

  const peers = db
    .prepare(
      "SELECT id, name, city, state, inst_type AS instType FROM institutions WHERE state = ? AND inst_type = ? AND id != ?"
    )
    .all(institution.state, institution.instType, institutionId) as Institution[];

  // Completions aggregated over the period per institution × CIP
  const rows = db.prepare(`
    WITH period AS (
      SELECT institution_id, cip_code, cip_title, SUM(completions) AS total
      FROM   ipeds_completions
      WHERE  year BETWEEN ? AND ?
      GROUP  BY institution_id, cip_code
    ),
    inst_data AS (
      SELECT cip_code, cip_title, total AS inst_completions
      FROM   period
      WHERE  institution_id = ?
    ),
    state_data AS (
      SELECT p.cip_code, p.cip_title,
             ROUND(AVG(p.total)) AS state_avg
      FROM   period p
      JOIN   institutions i ON i.id = p.institution_id
      WHERE  i.state = ? AND i.inst_type = ?
      GROUP  BY p.cip_code
    ),
    peer_data AS (
      SELECT p.cip_code,
             ROUND(AVG(p.total)) AS peer_avg
      FROM   period p
      JOIN   institutions i ON i.id = p.institution_id
      WHERE  i.state = ? AND i.inst_type = ? AND p.institution_id != ?
      GROUP  BY p.cip_code
    )
    SELECT
      sd.cip_code  AS cipCode,
      sd.cip_title AS cipTitle,
      COALESCE(id.inst_completions, 0) AS institutionCompletions,
      COALESCE(sd.state_avg,        0) AS stateAvgCompletions,
      COALESCE(pd.peer_avg,         0) AS peerAvgCompletions
    FROM  state_data sd
    LEFT  JOIN inst_data id ON id.cip_code = sd.cip_code
    LEFT  JOIN peer_data pd ON pd.cip_code = sd.cip_code
    ORDER BY institutionCompletions DESC
  `).all(
    yearStart, yearEnd,
    institutionId,
    institution.state, institution.instType,
    institution.state, institution.instType, institutionId
  ) as BenchmarkRow[];

  const data: BenchmarkData = { institution, peers, rows };
  return NextResponse.json(data);
}
