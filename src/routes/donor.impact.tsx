import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppHeader, donorNav } from "@/components/AppHeader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download, FileText } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      <AppHeader nav={donorNav} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">
            Impact & Records
          </h1>

          <p className="mt-2 text-muted-foreground">
            Monitor your community impact and access compliance documentation.
          </p>
        </div>

        {/* Hero Metrics */}
        {/* Hero Metrics */}
<div className="mb-10 grid gap-6 md:grid-cols-3">
  <MetricCard
    title="Food Batches Donated"
    value="1,250 batches"
    trend="+15% this month"
  />

  <MetricCard
    title="Total Donation Value"
    value="R195,000"
    trend="+12% this month"
  />

  <MetricCard
    title="Estimated CO₂ Offset"
    value="16.8 tonnes"
    trend="+8% this month"
  />
</div>

        {/* Donation Value Chart */}
        <div className="mb-10 rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold">
            Donation Value (Last 6 Months)
          </h2>

          <div className="h-[300px] w-full">
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Compliance Center</h2>

            <button className="text-sm font-medium text-primary hover:underline">
              View All
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
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
  );
}

function MetricCard({
  title,
  value,
  trend,
}: {
  title: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">
        {title}
      </p>

      <p className="mt-3 text-4xl font-bold tracking-tight">
        {value}
      </p>

      <p className="mt-2 text-sm font-medium text-emerald-600">
        {trend}
      </p>
    </div>
  );
}