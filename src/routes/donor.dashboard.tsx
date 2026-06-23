import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { loadRecentDonations, type RecentDonation } from "@/lib/donations";

function formatBatchId(id: number) {
  return `#${id.toString().padStart(3, "0")}`;
}

export const Route = createFileRoute("/donor/dashboard")({
  head: () => ({
    meta: [{ title: "Donor Dashboard — SurplusLink" }],
  }),
  component: DonorDashboard,
});

function DonorDashboard() {
  const [recent, setRecent] = useState<RecentDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const donations = await loadRecentDonations();
        setRecent(donations);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your donations.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={donorNav} userLabel="FM" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome, Fresh Market</h1> 
          <p className="mt-1 text-sm text-muted-foreground">
            Thank you for helping fight food waste in your community.
          </p>
        </div>

        {/* Quick Impact Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estimated People Fed</p>
            <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">1,240</p>
            <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-500">↑ 18% vs last month</p>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Kilos of Food Saved</p>
            <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">1,750 kg</p>
            <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-500">↑ 12% vs last month</p>
          </div>
        </div>
        <Link
          to="/donor/donate/consent"
          className="mb-6 inline-flex items-center gap-3 rounded-lg bg-primary px-5 py-3 text-primary-foreground shadow-sm transition hover:opacity-90 hover:scale-[1.02]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
            +
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Log New Donation</p>
          </div>
        </Link>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Donations</h2>
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Batch ID</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Date & Time</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Loading your donations…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-destructive">
                      {error}
                    </td>
                  </tr>
                ) : recent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No recent donations yet.
                    </td>
                  </tr>
                ) : (
                  recent.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-medium">{formatBatchId(r.id)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.time}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Claimed"
      ? "bg-warning/20 text-warning-foreground"
      : status === "Delivered"
        ? "bg-success/15 text-[color:var(--success)]"
        : "bg-secondary text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}