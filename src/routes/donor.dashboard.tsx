import CommunityMap from "@/components/CommunityMap";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { loadRecentDonations, type RecentDonation } from "@/lib/donations";

export const Route = createFileRoute("/donor/dashboard")({
  head: () => ({
    meta: [{ title: "Donor Dashboard — SurplusLink" }],
  }),
  component: DonorDashboard,
});

const defaultRecent: RecentDonation[] = [
  { id: "DN-20260521-091400-1A2B", category: "Mixed Produce", time: "Today, 09:14 AM", status: "Claimed", submittedAt: new Date().toISOString(), items: [] },
  { id: "DN-20260520-183000-3C4D", category: "Bakery Items", time: "Yesterday, 06:30 PM", status: "Pending", submittedAt: new Date().toISOString(), items: [] },
  { id: "DN-20260520-110000-5E6F", category: "Dairy", time: "Yesterday, 11:00 AM", status: "Delivered", submittedAt: new Date().toISOString(), items: [] },
];

function DonorDashboard() {
  const [recent, setRecent] = useState<RecentDonation[]>(defaultRecent);

  useEffect(() => {
    const storedRecent = loadRecentDonations();
    if (storedRecent.length > 0) {
      setRecent(storedRecent);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={donorNav} userLabel="FM" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome, Fresh Market</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Thank you for helping fight food waste in your community.
          </p>
        </div>

        {/* Log Donation Button */}
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

        {/* Recent Donations Table */}
        <section className="mb-10"> {/* Added bottom margin here to space it from the map */}
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
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium">{r.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.time}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* NEW SECTION: Community Network Map */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Community Network</h2>
          {/* I wrapped your map in the same rounded border style as your table so it matches seamlessly */}
          <div className="overflow-hidden rounded-xl border bg-card p-1">
            <CommunityMap loggedInDonorId="PASTE_A_TEST_UUID_HERE" />
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