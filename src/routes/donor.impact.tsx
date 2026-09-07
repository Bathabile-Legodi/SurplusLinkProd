import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppHeader, donorNav } from "@/components/AppHeader"; // kept for type compat — unused after migration

import { donorSidebarNav } from "@/lib/nav";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download, FileText, Package, Banknote, Leaf, ArrowUpRight } from "lucide-react";


export const Route = createFileRoute("/donor/impact")({
  
  head: () => ({
    meta: [{ title: "Impact & Records — SurplusLink" }],
  }),
  component: DonorImpact,
});

const chartData = [
  { month: "Jan", value: 12500 },
  { month: "Feb", value: 18750 },
  { month: "Mar", value: 15200 },
  { month: "Apr", value: 22100 },
  { month: "May", value: 28400 },
  { month: "Jun", value: 34200 },
];

const totalYearValue = 195000;

const documents = [
  {
    id: 1,
    period: "Q2 2026",
    type: "Quarterly Impact Report",
    date: "Jul 1, 2026",
  },
  {
    id: 2,
    period: "Q1 2026",
    type: "Quarterly Impact Report",
    date: "Apr 2, 2026",
  },
  {
    id: 3,
    period: "2025",
    type: "Annual CSR Summary",
    date: "Jan 15, 2026",
  },
  {
    id: 4,
    period: "Q4 2025",
    type: "Quarterly Impact Report",
    date: "Jan 5, 2026",
  },
];

function DonorImpact() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div className="relative min-h-[calc(100vh-56px)] overflow-hidden page-transition">
        {/* Background blobs */}
        <div className="pointer-events-none absolute -top-1/4 -right-1/4 h-[600px] w-[600px] animate-pulse rounded-full bg-primary/5 blur-[150px] [animation-duration:15s]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] animate-pulse rounded-full bg-secondary/5 blur-[120px] [animation-duration:10s]" />

        <main className="relative mx-auto max-w-7xl px-6 py-10 z-10">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Impact & Records
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Monitor your community impact and access compliance documentation.
            </p>
          </div>

          {/* Hero Metrics */}
        {/* Hero Metrics */}
          <div className="mb-12 grid gap-6 md:grid-cols-3">
            <MetricCard
              title="Food Batches Donated"
              value="1,250"
              subtitle="batches"
              trend="+15% this month"
              icon={<Package className="h-5 w-5" />}
            />

            <MetricCard
              title="Total Donation Value"
              value="R195,000"
              trend="+12% this month"
              icon={<Banknote className="h-5 w-5" />}
            />

            <MetricCard
              title="Estimated CO₂ Offset"
              value="16.8"
              subtitle="tonnes"
              trend="+8% this month"
              icon={<Leaf className="h-5 w-5" />}
            />
          </div>

          {/* Donation Value Chart */}
          <div className="mb-12 glass rounded-3xl p-8 shadow-sm" style={{ boxShadow: "0 8px 32px oklch(0.18 0.16 264 / 0.05)" }}>
            <h2 className="mb-8 text-lg font-bold text-foreground">
              Donation Value (Last 6 Months)
            </h2>

            <div className="h-[320px] w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 10,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    dy={10}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    tickFormatter={(value) =>
                      `R${Number(value).toLocaleString()}`
                    }
                  />

                  <Tooltip
                    cursor={{
                      fill: "hsl(var(--muted)/0.5)",
                    }}
                    formatter={(value) => [
                      `R${Number(value).toLocaleString()}`,
                      "Donation Value",
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      boxShadow:
                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />

                  <Bar
                    dataKey="value"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Total Annual Donation Value */}
          <div className="mt-6 border-t pt-5">
            <p className="text-sm text-muted-foreground">
              Total Rand Value of Food Donated This Year
            </p>

            <p className="mt-1 text-2xl font-bold">
              R{totalYearValue.toLocaleString()}
            </p>
          </div>
        </div>

          {/* Compliance Center */}
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Compliance Center</h2>
              <button className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors">
                View All →
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl glass shadow-sm" style={{ boxShadow: "0 8px 32px oklch(0.18 0.16 264 / 0.05)" }}>
              <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 text-left font-medium">
                    Period
                  </th>

                  <th className="px-6 py-4 text-left font-medium">
                    Document Type
                  </th>

                  <th className="px-6 py-4 text-left font-medium">
                    Generation Date
                  </th>

                  <th className="px-6 py-4 text-right font-medium">
                    Export Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="group transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-4 font-medium">
                      {doc.period}
                    </td>

                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />

                        {doc.type}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-muted-foreground">
                      {doc.date}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          className="inline-flex items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          onClick={() => alert("Downloading PDF...")}
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          PDF
                        </button>

                        <button
                          className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          onClick={() => alert("Exporting CSR Data...")}
                        >
                          CSR Data
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend: string;
  icon: React.ReactNode;
}) {
  return (
    <div 
      className="glass rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
      style={{ boxShadow: "0 8px 32px oklch(0.18 0.16 264 / 0.05)" }}
    >
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground border border-border/50">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-black tracking-tight text-foreground">
          {value}
        </p>
        {subtitle && (
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <div className="flex items-center justify-center rounded-full bg-emerald-500/10 p-1 text-emerald-600">
          <ArrowUpRight className="h-3 w-3" />
        </div>
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
          {trend}
        </p>
      </div>
    </div>
  );
}