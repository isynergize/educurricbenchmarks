"use client";

import type { FilterOptions, DashboardFilters } from "@/lib/types";

interface FilterBarProps {
  options: FilterOptions;
  filters: DashboardFilters;
  onChange: (f: DashboardFilters) => void;
}

export default function FilterBar({ options, filters, onChange }: FilterBarProps) {
  const minYear = options.years[0] ?? 2019;
  const maxYear = options.years[options.years.length - 1] ?? 2023;

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* State */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">State</label>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.state ?? ""}
          onChange={(e) => onChange({ ...filters, state: e.target.value || undefined })}
        >
          <option value="">All States</option>
          {options.states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Institution Type */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Institution Type</label>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.instType ?? ""}
          onChange={(e) => onChange({ ...filters, instType: e.target.value || undefined })}
        >
          <option value="">All Types</option>
          {options.instTypes.map((t) => (
            <option key={t} value={t}>{t === "4yr" ? "4-Year" : "2-Year"}</option>
          ))}
        </select>
      </div>

      {/* Year Range */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Year Range: {filters.yearStart ?? minYear} – {filters.yearEnd ?? maxYear}
        </label>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.yearStart ?? minYear}
            onChange={(e) => onChange({ ...filters, yearStart: parseInt(e.target.value) })}
          >
            {options.years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="text-slate-400">to</span>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.yearEnd ?? maxYear}
            onChange={(e) => onChange({ ...filters, yearEnd: parseInt(e.target.value) })}
          >
            {options.years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reset */}
      <button
        className="ml-auto rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        onClick={() => onChange({})}
      >
        Reset
      </button>
    </div>
  );
}
