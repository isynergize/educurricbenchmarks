import Dashboard from "@/components/Dashboard";
import { getDashboardData, getFilterOptions } from "@/lib/queries";

export default async function Home() {
  const [data, filterOptions] = await Promise.all([
    Promise.resolve(getDashboardData()),
    Promise.resolve(getFilterOptions()),
  ]);

  return <Dashboard initialData={data} filterOptions={filterOptions} />;
}
