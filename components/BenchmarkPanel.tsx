"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { BenchmarkData, DashboardFilters, Institution } from "@/lib/types";

interface Props {
  institutions: Institution[];
  filters: DashboardFilters;
}

function pctDiff(inst: number, peer: number) {
  if (peer === 0) return null;
  return Math.round((inst / peer - 1) * 100);
}

export default function BenchmarkPanel({ institutions, filters }: Props) {
  const [institutionId, setInstitutionId] = useState<string>("");
  const [data, setData]     = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(false);

  const available = filters.state
    ? institutions.filter(i => i.state === filters.state)
    : institutions;

  useEffect(() => {
    if (!institutionId) { setData(null); return; }
    setLoading(true);
    const params = new URLSearchParams({ institutionId });
    if (filters.yearStart) params.set("yearStart", String(filters.yearStart));
    if (filters.yearEnd)   params.set("yearEnd",   String(filters.yearEnd));
    fetch(`/api/benchmarking?${params}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [institutionId, filters.yearStart, filters.yearEnd]);

  // Reset selection when state filter changes and selected inst is no longer in list
  useEffect(() => {
    if (institutionId && !available.find(i => i.id === institutionId)) {
      setInstitutionId("");
    }
  }, [filters.state]);

  const chartData = data?.rows.slice(0, 8).map(r => ({
    name: r.cipTitle.replace(", General", "").replace(" and ", " & ").slice(0, 22),
    Institution: r.institutionCompletions,
    "State Avg":  r.stateAvgCompletions,
    "Peer Avg":   r.peerAvgCompletions,
  })) ?? [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Institution Benchmarking
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Program mix vs. state average and peer institutions (same state · same type).
          </p>
        </div>
        <select
          value={institutionId}
          onChange={e => setInstitutionId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select institution…</option>
          {available.map(i => (
            <option key={i.id} value={i.id}>
              {i.name} — {i.city}, {i.state} ({i.instType})
            </option>
          ))}
        </select>
      </div>

      {!institutionId && !loading && (
        <div className="px-5 py-10 text-center text-sm text-slate-400">
          Select an institution above to compare its program mix.
        </div>
      )}

      {loading && (
        <div className="px-5 py-10 text-center text-sm text-slate-400">Loading…</div>
      )}

      {data && !loading && (
        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{data.institution.name}</span>
            <span className="text-slate-300">·</span>
            <span>{data.institution.city}, {data.institution.state}</span>
            <span className="text-slate-300">·</span>
            <span>{data.institution.instType}</span>
            <span className="text-slate-300">·</span>
            <span>compared against {data.peers.length} peer institution{data.peers.length !== 1 ? "s" : ""}</span>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ left: 4, right: 4, top: 4, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={-20}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Institution" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="State Avg"   fill="#94a3b8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Peer Avg"    fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2 text-left">Program</th>
                  <th className="px-4 py-2 text-right">Institution</th>
                  <th className="px-4 py-2 text-right">State Avg</th>
                  <th className="px-4 py-2 text-right">Peer Avg</th>
                  <th className="px-4 py-2 text-right">vs. Peers</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => {
                  const diff = pctDiff(row.institutionCompletions, row.peerAvgCompletions);
                  return (
                    <tr key={i} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-800">
                        {row.cipTitle}
                        <span className="ml-1 text-xs text-slate-400">{row.cipCode}</span>
                      </td>
                      <td className="px-4 py-2 text-right text-slate-700">
                        {row.institutionCompletions.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-500">
                        {row.stateAvgCompletions.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-500">
                        {row.peerAvgCompletions.toLocaleString()}
                      </td>
                      <td className={`px-4 py-2 text-right font-medium ${
                        diff === null ? "text-slate-400" :
                        diff > 0  ? "text-green-600" : "text-red-500"
                      }`}>
                        {diff === null ? "—" : diff >= 0 ? `+${diff}%` : `${diff}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
