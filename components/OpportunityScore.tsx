"use client";

import type { ScoringRow } from "@/lib/types";

interface Props { data: ScoringRow[] }

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-5 text-right text-xs text-slate-400">{value}</span>
    </div>
  );
}

export default function OpportunityScore({ data }: Props) {
  const top = data.slice(0, 10);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Program Opportunity Scoring — Top New Program Candidates
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Composite 0–100: 40% weighted gap + 30% wage level + 30% demand size. Higher = stronger opportunity.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="w-6 px-4 py-3 text-left">#</th>
              <th className="px-5 py-3 text-left">Program (CIP)</th>
              <th className="px-5 py-3 text-left">Occupation (SOC)</th>
              <th className="px-4 py-3 text-right">Avg Wage</th>
              <th className="px-4 py-3">Gap</th>
              <th className="px-4 py-3">Wage</th>
              <th className="px-4 py-3">Demand</th>
              <th className="px-4 py-3 text-center">Score</th>
            </tr>
          </thead>
          <tbody>
            {top.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-400">{i + 1}</td>
                <td className="px-5 py-3 font-medium text-slate-800">
                  {row.cipTitle}
                  <span className="ml-1 text-xs text-slate-400">{row.cipCode}</span>
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {row.socTitle}
                  <span className="ml-1 text-xs text-slate-400">{row.socCode}</span>
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  ${row.avgWage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3">
                  <MiniBar value={row.wgapComponent} color="bg-red-400" />
                </td>
                <td className="px-4 py-3">
                  <MiniBar value={row.wageComponent} color="bg-amber-400" />
                </td>
                <td className="px-4 py-3">
                  <MiniBar value={row.demandComponent} color="bg-blue-400" />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="inline-flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          row.opportunityScore >= 70
                            ? "bg-green-500"
                            : row.opportunityScore >= 40
                            ? "bg-amber-500"
                            : "bg-slate-400"
                        }`}
                        style={{ width: `${row.opportunityScore}%` }}
                      />
                    </div>
                    <span
                      className={`w-6 text-right text-sm font-bold ${
                        row.opportunityScore >= 70
                          ? "text-green-700"
                          : row.opportunityScore >= 40
                          ? "text-amber-600"
                          : "text-slate-500"
                      }`}
                    >
                      {row.opportunityScore}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
