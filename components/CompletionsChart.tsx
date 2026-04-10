"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { CompletionTrend } from "@/lib/types";

const LINE_COLORS = [
  "#1d4ed8","#059669","#dc2626","#d97706",
  "#7c3aed","#0891b2",
];

interface Props { data: CompletionTrend[] }

export default function CompletionsChart({ data }: Props) {
  // Pivot to { year, [cipTitle]: completions }
  const years = [...new Set(data.map((r) => r.year))].sort();
  const fields = [...new Set(data.map((r) => r.cipTitle))];

  const chartData = years.map((year) => {
    const row: Record<string, number | string> = { year };
    for (const field of fields) {
      const match = data.find((r) => r.year === year && r.cipTitle === field);
      row[field] = match?.completions ?? 0;
    }
    return row;
  });

  const shortName = (t: string) =>
    t.replace("Administration", "Admin").replace(", General", "").replace("Registered ", "");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Completions by Program (trend)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={40} />
          <Tooltip
            formatter={(v, name) => [Number(v).toLocaleString(), shortName(String(name))]}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend formatter={shortName} wrapperStyle={{ fontSize: 11 }} />
          {fields.map((field, i) => (
            <Line
              key={field}
              type="monotone"
              dataKey={field}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
