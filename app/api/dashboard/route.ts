import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const data = getDashboardData({
    state:     searchParams.get("state")     ?? undefined,
    instType:  searchParams.get("instType")  ?? undefined,
    yearStart: searchParams.has("yearStart") ? parseInt(searchParams.get("yearStart")!) : undefined,
    yearEnd:   searchParams.has("yearEnd")   ? parseInt(searchParams.get("yearEnd")!)   : undefined,
  });

  return NextResponse.json(data);
}
