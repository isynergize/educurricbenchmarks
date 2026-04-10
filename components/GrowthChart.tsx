"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { OccupationRow } from "@/lib/types";

const COLORS = [
  "#1d4ed8","#2563eb","#3b82f6","#60a5fa","#93c5fd",
  "#bfdbfe","#1e40af","#1e3a8a","#172554","#0369a1",
];

interface Props { data: OccupationRow[] }

export default function GrowthChart({ data }: Props) {
  const chartData = [...data]
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, 8)
    .map((r) => ({
      name: r.socTitle.replace("and ", "& ").replace("Specialists", "Spec."),
      growth: r.growthRate,
      wage: Math.round(r.meanWage / 1000),
    }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Employment Growth by Occupation (% over period)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 32, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" unit="%" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v) => [`${Number(v).toFixed(1)}%`, "Growth"]}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="growth" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
