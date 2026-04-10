"use client";

import { useState, useEffect, useCallback } from "react";
import StatCard from "./StatCard";
import FilterBar from "./FilterBar";
import GrowthChart from "./GrowthChart";
import CompletionsChart from "./CompletionsChart";
import GapTable from "./GapTable";
import OpportunityScore from "./OpportunityScore";
import BenchmarkPanel from "./BenchmarkPanel";
import type { DashboardData, FilterOptions, DashboardFilters } from "@/lib/types";

interface Props {
  initialData: DashboardData;
  filterOptions: FilterOptions;
}

export default function Dashboard({ initialData, filterOptions }: Props) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (f: DashboardFilters) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.state)     params.set("state",     f.state);
    if (f.instType)  params.set("instType",  f.instType);
    if (f.yearStart) params.set("yearStart", String(f.yearStart));
    if (f.yearEnd)   params.set("yearEnd",   String(f.yearEnd));
    try {
      const res = await fetch(`/api/dashboard?${params}`);
      const json: DashboardData = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFiltersChange = (f: DashboardFilters) => {
    setFilters(f);
    fetchData(f);
  };

  const { stats } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 px-8 py-6 text-white shadow">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-xl font-bold tracking-tight">
            Higher Ed Curriculum Benchmarks
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            IPEDS completions vs. BLS labor demand — identify where new programs are needed
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-8 py-8">
        {/* Filters */}
        <FilterBar
          options={filterOptions}
          filters={filters}
          onChange={handleFiltersChange}
        />

        {/* Loading overlay hint */}
        {loading && (
          <div className="text-center text-sm text-slate-400">Refreshing data...</div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total Completions"
            value={stats.totalCompletions.toLocaleString()}
            sub="across selected period & filters"
            accent="blue"
          />
          <StatCard
            label="Tracked Occupations"
            value={String(stats.totalOccupations)}
            sub="BLS SOC codes in view"
            accent="green"
          />
          <StatCard
            label="Avg. Annual Wage"
            value={`$${Math.round(stats.avgWage / 1000)}k`}
            sub="across matched occupations"
            accent="amber"
          />
          <StatCard
            label="High-Gap Programs"
            value={String(stats.gapCount)}
            sub="employment outpacing completions"
            accent="red"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GrowthChart data={data.topOccupations} />
          <CompletionsChart data={data.completionTrends} />
        </div>

        {/* Gap Table */}
        <GapTable data={data.gapAnalysis} />

        {/* Opportunity Scoring */}
        <OpportunityScore data={data.scoring} />

        {/* Benchmarking */}
        <BenchmarkPanel
          institutions={filterOptions.institutions}
          filters={filters}
        />
      </main>
    </div>
  );
}
