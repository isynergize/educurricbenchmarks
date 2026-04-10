import Dashboard from "@/components/Dashboard";
import type { DashboardData, FilterOptions } from "@/lib/types";

async function getDashboardData(): Promise<DashboardData> {
  const res = await fetch("http://localhost:3000/api/dashboard", { cache: "no-store" });
  return res.json();
}

async function getFilterOptions(): Promise<FilterOptions> {
  const res = await fetch("http://localhost:3000/api/filters", { cache: "no-store" });
  return res.json();
}

export default async function Home() {
  const [data, filterOptions] = await Promise.all([
    getDashboardData(),
    getFilterOptions(),
  ]);

  return <Dashboard initialData={data} filterOptions={filterOptions} />;
}
