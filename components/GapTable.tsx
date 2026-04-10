"use client";

import type { GapRow } from "@/lib/types";

interface Props { data: GapRow[] }

function GapBadge({ score }: { score: number }) {
  if (score > 25)  return <span className="rounded-full bg-red-100   px-2 py-0.5 text-xs font-semibold text-red-700">High Gap</span>;
  if (score > 10)  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Moderate</span>;
  if (score > 0)   return <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-semibold text-yellow-600">Low Gap</span>;
  return               <span className="rounded-full bg-green-100  px-2 py-0.5 text-xs font-semibold text-green-700">Aligned</span>;
}

function pct(n: number) {
  return n >= 0 ? `+${n.toFixed(1)}%` : `${n.toFixed(1)}%`;
}

export default function GapTable({ data }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Program Gap Analysis — Employment Growth vs. Completions Growth
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Sorted by weighted gap score (raw gap × wage premium vs. $90k baseline). Demand score = growth × employment volume.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 text-left">Program (CIP)</th>
              <th className="px-5 py-3 text-left">Occupation (SOC)</th>
              <th className="px-4 py-3 text-right">Completions</th>
              <th className="px-4 py-3 text-right">Avg Employment</th>
              <th className="px-4 py-3 text-right">Avg Wage</th>
              <th className="px-4 py-3 text-right">Comp. Growth</th>
              <th className="px-4 py-3 text-right">Emp. Growth</th>
              <th className="px-4 py-3 text-right">Gap Score</th>
              <th className="px-4 py-3 text-right">Wtd. Gap</th>
              <th className="px-4 py-3 text-right">Demand Score</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="px-5 py-3 font-medium text-slate-800">
                  {row.cipTitle}
                  <span className="ml-1 text-xs text-slate-400">{row.cipCode}</span>
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {row.socTitle}
                  <span className="ml-1 text-xs text-slate-400">{row.socCode}</span>
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {row.totalCompletions.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {row.avgEmployment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  ${row.avgWage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${row.completionsGrowth >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {pct(row.completionsGrowth)}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${row.employmentGrowth >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {pct(row.employmentGrowth)}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${row.gapScore > 10 ? "text-red-600" : row.gapScore > 0 ? "text-amber-600" : "text-slate-400"}`}>
                  {pct(row.gapScore)}
                </td>
                <td className={`px-4 py-3 text-right font-bold ${row.weightedGapScore > 10 ? "text-red-600" : row.weightedGapScore > 0 ? "text-amber-600" : "text-slate-400"}`}>
                  {pct(row.weightedGapScore)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {row.demandScore.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-center">
                  <GapBadge score={row.weightedGapScore} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
