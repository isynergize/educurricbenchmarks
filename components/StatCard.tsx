"use client";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "blue" | "green" | "amber" | "red";
}

const accents = {
  blue:  "border-blue-500  bg-blue-50  text-blue-700",
  green: "border-green-500 bg-green-50 text-green-700",
  amber: "border-amber-500 bg-amber-50 text-amber-700",
  red:   "border-red-500   bg-red-50   text-red-700",
};

export default function StatCard({ label, value, sub, accent = "blue" }: StatCardProps) {
  return (
    <div className={`rounded-xl border-l-4 p-5 shadow-sm ${accents[accent]} bg-white`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs opacity-60">{sub}</p>}
    </div>
  );
}
