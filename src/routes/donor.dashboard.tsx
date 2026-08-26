import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { mapBatchRow, type RecentDonation } from "@/lib/donations";
import { requireRole } from "@/lib/auth-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function formatBatchId(id: number) {
  return `#${id.toString().padStart(3, "0")}`;
}

export const getDonorDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, organization_name, name")
    .eq("id", user.id)
    .maybeSingle();

  const resolvedName =
    profile?.business_name ||
    profile?.organization_name ||
    profile?.name ||
    user.user_metadata?.business_name ||
    user.user_metadata?.organization_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Partner";

  const { data, error } = await supabase
    .from("donation_batches")
    .select("*, donation_items(*)")
    .eq("donor_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Failed to load donations:", error);
  }

  return {
    displayName: resolvedName,
    recent: (data || []).map(mapBatchRow),
  };
});

export const donorDashboardQueryOptions = queryOptions({
  queryKey: ["donor", "dashboard"],
  queryFn: () => getDonorDashboardStats(),
});

export const Route = createFileRoute("/donor/dashboard")({
  beforeLoad: () => requireRole("donor"),
  head: () => ({
    meta: [{ title: "Donor Dashboard — SurplusLink" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(donorDashboardQueryOptions),
  component: DonorDashboard,
});

function DonorDashboard() {
  const { data: { displayName, recent } } = useSuspenseQuery(donorDashboardQueryOptions);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={donorNav} userLabel={displayName.slice(0, 2).toUpperCase()} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Welcome Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome, {displayName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Thank you for helping fight food waste in your community.
            </p>
          </div>
        </div>

        {/* Quick Impact Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl glass p-5 transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Estimated People Fed
            </p>
            <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">
              1,240
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-500">
              ↑ 18% vs last month
            </p>
          </div>
          <div className="rounded-2xl glass p-5 transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Kilos of Food Saved
            </p>
            <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">
              1,750 kg
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-500">
              ↑ 12% vs last month
            </p>
          </div>
        </div>

        {/* Log Donation Button */}
        <Link
          to="/donor/donate/consent"
          className="mb-6 inline-flex items-center gap-3 rounded-xl bg-primary px-5 py-3 text-primary-foreground shadow-md shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/35 hover:-translate-y-0.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
            +
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Log New Donation</p>
          </div>
        </Link>

        {/* Recent Donations Table */}
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Recent Donations
          </h2>
          <div className="overflow-hidden rounded-2xl glass">
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
                {recent.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-muted-foreground"
                    >
                      No recent donations yet.
                    </td>
                  </tr>
                ) : (
                  recent.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-medium">
                        {formatBatchId(r.id)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.category}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.time}
                      </td>
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
  const normalized = status.toLowerCase();
  const tone =
    normalized === "claimed"
      ? "bg-warning/20 text-warning-foreground"
      : normalized === "delivered"
        ? "bg-success/15 text-[color:var(--success)]"
        : "bg-secondary text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tone}`}
    >
      {status}
    </span>
  );
}