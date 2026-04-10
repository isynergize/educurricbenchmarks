import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import type { FilterOptions, Institution } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  seedDatabase(db);

  const states = (db.prepare("SELECT DISTINCT state FROM ipeds_completions ORDER BY state").all() as { state: string }[])
    .map((r) => r.state);

  const years = (db.prepare("SELECT DISTINCT year FROM ipeds_completions ORDER BY year").all() as { year: number }[])
    .map((r) => r.year);

  const instTypes = (db.prepare("SELECT DISTINCT inst_type FROM ipeds_completions ORDER BY inst_type").all() as { inst_type: string }[])
    .map((r) => r.inst_type);

  const institutions = db.prepare(
    "SELECT id, name, city, state, inst_type AS instType FROM institutions ORDER BY state, name"
  ).all() as Institution[];

  const options: FilterOptions = { states, years, instTypes, institutions };
  return NextResponse.json(options);
}
