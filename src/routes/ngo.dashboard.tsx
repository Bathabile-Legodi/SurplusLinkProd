import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { useNgoVerification } from "@/hooks/useNgoVerification";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Package,
  Truck,
  Users,
  Wheat,
  Clock,
  LogOut,
  ExternalLink,
  Activity,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatExpiresIn(datetime: string): string {
  const diff = new Date(datetime).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatRelative(isoString: string | null): string {
  if (!isoString) return "—";
  const diff = Date.now() - new Date(isoString).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  if (d >= 1) return d === 1 ? "Yesterday" : `${d} days ago`;
  if (h >= 1) return `${h}h ago`;
  const m = Math.floor(diff / 60_000);
  return m <= 1 ? "Just now" : `${m}m ago`;
}

function formatCollectionTime(dt: string | null): string {
  if (!dt) return "—";
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dt));
}

function statusMeta(status: string) {
  const s = status.toLowerCase();
  if (s === "claimed")   return { label: "Claimed",   cls: "bg-blue-100 text-blue-700 border-blue-200" };
  if (s === "delivered") return { label: "Delivered", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (s === "cancelled") return { label: "Cancelled", cls: "bg-red-100 text-red-600 border-red-200" };
  return { label: status, cls: "bg-neutral-100 text-neutral-500 border-neutral-200" };
}

// ─── Server fn ──────────────────────────────────────────────────────────────

export const getNgoDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const now = new Date();
  const nowIso = now.toISOString();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  // 1. Available (unclaimed, not expired)
  const { count: availableCount } = await supabase
    .from("donation_batches")
    .select("*", { count: "exact", head: true })
    .in("status", ["unclaimed", "Unclaimed"])
    .or(`collection_datetime.gte.${nowIso},collection_datetime.is.null`);

  // 2. Active claims (claimed by this NGO, not yet delivered)
  const { count: activeClaimsCount } = await supabase
    .from("donation_batches")
    .select("*", { count: "exact", head: true })
    .eq("claimed_by", user.id)
    .in("status", ["claimed", "Claimed"]);

  // 3. All claimed batches — for meals + kg calculation
  const { data: allClaimed } = await supabase
    .from("donation_batches")
    .select("id, donation_items(quantity, unit)")
    .eq("claimed_by", user.id);

  let totalMeals = 0;
  let totalKg = 0;
  if (allClaimed) {
    allClaimed.forEach((batch: any) => {
      batch.donation_items?.forEach((item: any) => {
        const qty = parseFloat(item.quantity) || 0;
        const isKg = item.unit?.toLowerCase().includes("kg");
        if (isKg) {
          totalMeals += qty * 2;
          totalKg += qty;
        } else {
          totalMeals += qty;
        }
      });
    });
  }

  // 4. Urgent — unclaimed, collection window expiring within 24 hrs
  const { data: urgentRaw } = await supabase
    .from("donation_batches")
    .select(`
      id,
      batch_type,
      collection_datetime,
      donors!donor_id (organization_name)
    `)
    .in("status", ["unclaimed", "Unclaimed"])
    .gte("collection_datetime", nowIso)
    .lte("collection_datetime", in24h)
    .order("collection_datetime", { ascending: true })
    .limit(5);

  const urgentDonations = (urgentRaw || []).map((row: any) => ({
    id: row.id as string,
    batch_type: (row.batch_type ?? "Donation") as string,
    collection_datetime: row.collection_datetime as string,
    donor: (row.donors?.organization_name ?? "A donor") as string,
    expiresIn: formatExpiresIn(row.collection_datetime),
  }));

  // 5. Active claims list (max 5, for the table)
  const { data: activeRaw } = await supabase
    .from("donation_batches")
    .select(`
      id,
      batch_type,
      status,
      collection_datetime,
      donors!donor_id (organization_name)
    `)
    .eq("claimed_by", user.id)
    .in("status", ["claimed", "Claimed"])
    .order("collection_datetime", { ascending: true })
    .limit(5);

  const activeClaims = (activeRaw || []).map((row: any) => ({
    id: row.id as string,
    batch_type: (row.batch_type ?? "Donation") as string,
    status: row.status as string,
    collection_datetime: row.collection_datetime as string | null,
    donor: (row.donors?.organization_name ?? "—") as string,
  }));

  // 6. Recent activity (last 5, any status)
  const { data: recentRaw } = await supabase
    .from("donation_batches")
    .select("id, batch_type, status, claimed_at")
    .eq("claimed_by", user.id)
    .order("claimed_at", { ascending: false })
    .limit(5);

  const recentActivity = (recentRaw || []).map((row: any) => ({
    id: row.id as string,
    batch_type: (row.batch_type ?? "Donation") as string,
    status: row.status as string,
    claimed_at: row.claimed_at as string | null,
  }));

  return {
    available: (availableCount || 0).toString(),
    activeClaimsCount: (activeClaimsCount || 0).toString(),
    mealsServed: Math.round(totalMeals).toLocaleString("en-ZA"),
    kgRescued: Math.round(totalKg).toLocaleString("en-ZA"),
    urgentDonations,
    activeClaims,
    recentActivity,
  };
});

export const ngoDashboardQueryOptions = queryOptions({
  queryKey: ["ngo", "dashboard", "stats"],
  queryFn: () => getNgoDashboardStats(),
});

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/ngo/dashboard")({
  head: () => ({ meta: [{ title: "NGO Dashboard — SurplusLink" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(ngoDashboardQueryOptions),
  component: NgoDashboard,
});

// ─── Component ──────────────────────────────────────────────────────────────

function NgoDashboard() {
  const { isAuthorized, isVerified, isChecking, user } = useNgoVerification();
  const { signOut } = useAuth();
  const { data: stats } = useSuspenseQuery(ngoDashboardQueryOptions);

  const orgName = user?.user_metadata?.organization_name ?? "Organisation";
  const todayLabel = new Intl.DateTimeFormat("en-ZA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  // ── Loading skeleton ──
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-14 glass-nav" />
        <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
          <div className="flex items-start justify-between">
            <div><Skeleton className="h-8 w-56 mb-2" /><Skeleton className="h-4 w-40" /></div>
            <Skeleton className="h-10 w-44 rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!isAuthorized) return null;

  // ── Unverified state ──
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader nav={ngoNav} userLabel={orgName.slice(0, 2).toUpperCase()} />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-2xl font-bold tracking-tight">NGO Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back, {orgName}.</p>
          <div className="mt-6 rounded-2xl glass border-l-4 border-warning p-6" style={{ boxShadow: "0 4px 16px oklch(0.82 0.16 85 / 0.12)" }}>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="text-sm font-semibold">Account Pending Approval</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Our team is reviewing your application. Please allow 3–7 working days. You'll receive a notification once verified and granted full access to claim donations.
                </p>
                <div className="mt-4 flex gap-3">
                  <Link to="/ngo/verification" className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
                    View Status
                  </Link>
                  <button onClick={signOut} className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-secondary transition-colors">
                    <LogOut className="h-3 w-3" /> Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Verified dashboard ──
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Background depth blob */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-primary/4 blur-[100px]" />

      <AppHeader nav={ngoNav} userLabel={orgName.slice(0, 2).toUpperCase()} />

      <main className="relative mx-auto max-w-5xl px-6 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">Welcome back, {orgName}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{todayLabel}</p>
          </div>
          <Link
            to="/ngo/explore"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5 shrink-0"
          >
            Explore Donations
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={Package} label="Available Nearby" value={stats.available} sub="unclaimed now" />
          <StatCard icon={Truck}   label="Active Claims"    value={stats.activeClaimsCount} sub="in progress" accent />
          <StatCard icon={Users}   label="Meals Served"     value={stats.mealsServed} sub="all time" />
          <StatCard icon={Wheat}   label="Kg Rescued"       value={`${stats.kgRescued} kg`} sub="all time" />
        </div>

        {/* ── Urgent strip ── */}
        <UrgentSection donations={stats.urgentDonations} />

        {/* ── Active claims ── */}
        <ActiveClaimsSection claims={stats.activeClaims} />

        {/* ── Recent activity ── */}
        <RecentActivitySection activity={stats.recentActivity} />

      </main>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl border ${accent ? "bg-primary/10 border-primary/15" : "bg-primary/8 border-primary/10"}`}>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function UrgentSection({ donations }: { donations: { id: string; batch_type: string; collection_datetime: string; donor: string; expiresIn: string }[] }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <h2 className="text-sm font-bold text-red-600 uppercase tracking-widest">Urgent — Expiring Within 24 Hours</h2>
      </div>

      {donations.length === 0 ? (
        <div className="glass rounded-2xl px-6 py-8 text-center text-sm text-muted-foreground border border-neutral-200/60">
          No urgent donations right now — check back soon.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-red-200/60" style={{ background: "oklch(0.98 0.02 25 / 0.60)", backdropFilter: "blur(16px) saturate(1.6)", boxShadow: "0 8px 32px oklch(0.55 0.22 27 / 0.08), 0 2px 8px oklch(0.55 0.22 27 / 0.05)" }}>
          <ul className="divide-y divide-red-100/80">
            {donations.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 border border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{d.batch_type}</p>
                    <p className="text-xs text-muted-foreground truncate">From {d.donor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600">
                    <Clock className="h-3 w-3" /> {d.expiresIn}
                  </span>
                  <Link
                    to="/ngo/donations/$id"
                    params={{ id: d.id }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-600/20 transition-all hover:bg-red-700 hover:shadow-lg"
                  >
                    View & Claim <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ActiveClaimsSection({ claims }: { claims: { id: string; batch_type: string; status: string; collection_datetime: string | null; donor: string }[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/70">Your Active Claims</h2>
        <Link to="/ngo/claims" className="text-xs font-medium text-primary hover:underline transition-colors">
          View all →
        </Link>
      </div>

      {claims.length === 0 ? (
        <div className="glass rounded-2xl px-6 py-8 text-center text-sm text-muted-foreground">
          No active claims. <Link to="/ngo/explore" className="text-primary hover:underline font-medium">Explore available donations →</Link>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-black/[0.02]">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</th>
                <th className="hidden sm:table-cell px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">From</th>
                <th className="hidden md:table-cell px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Collection</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {claims.map((c) => {
                const { label, cls } = statusMeta(c.status);
                return (
                  <tr key={c.id} className="transition-colors hover:bg-black/[0.015]">
                    <td className="px-5 py-3.5 font-medium">{c.batch_type}</td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-muted-foreground">{c.donor}</td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-muted-foreground">{formatCollectionTime(c.collection_datetime)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to="/ngo/donations/$id"
                        params={{ id: c.id }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Track <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RecentActivitySection({ activity }: { activity: { id: string; batch_type: string; status: string; claimed_at: string | null }[] }) {
  const iconFor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "delivered") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (s === "claimed")   return <Truck className="h-4 w-4 text-primary" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/70">Recent Activity</h2>
        <Link to="/ngo/claims" className="text-xs font-medium text-primary hover:underline transition-colors">
          Full history →
        </Link>
      </div>

      {activity.length === 0 ? (
        <div className="glass rounded-2xl px-6 py-8 text-center text-sm text-muted-foreground">
          No activity yet. Start by exploring available donations.
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <ul className="divide-y divide-border/40">
            {activity.map((a) => {
              const { label, cls } = statusMeta(a.status);
              return (
                <li key={a.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-black/[0.015]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/60">
                    {iconFor(a.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.batch_type}</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(a.claimed_at)}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}