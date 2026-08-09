import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { useNgoVerification } from "@/hooks/useNgoVerification";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/ngo/dashboard")({
  head: () => ({ meta: [{ title: "NGO Dashboard — SurplusLink" }] }),
  component: NgoDashboard,
});

function NgoDashboard() {
  const { isAuthorized, isVerified, isChecking, user } = useNgoVerification();
  const { signOut } = useAuth();
  const [stats, setStats] = useState({
    available: "0",
    claimsThisWeek: "0",
    mealsServed: "0"
  });

  useEffect(() => {
    if (!user || !isVerified) return;

    async function fetchStats() {
      const now = new Date().toISOString();
      
      // 1. Available nearby (Unclaimed and NOT expired batches)
      const { count: availableCount } = await supabase
        .from('donation_batches')
        .select('*', { count: 'exact', head: true })
        .in('status', ['unclaimed', 'Unclaimed'])
        .or(`collection_datetime.gte.${now},collection_datetime.is.null`);
        
      // 2. Claims this week
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

      const { count: claimsCount } = await supabase
        .from('donation_batches')
        .select('*', { count: 'exact', head: true })
        .eq('claimed_by', user.id)
        .gte('claimed_at', startOfWeek.toISOString());

      // 3. Meals served (estimate based on total claimed quantities)
      const { data: claimedBatches } = await supabase
        .from('donation_batches')
        .select('id, donation_items(quantity, unit)')
        .eq('claimed_by', user.id);

      let totalMeals = 0;
      if (claimedBatches) {
        claimedBatches.forEach((batch: any) => {
          batch.donation_items?.forEach((item: any) => {
            const qty = parseFloat(item.quantity) || 0;
            // Rough estimation: 1kg = 2 meals, otherwise 1 item = 1 meal
            if (item.unit?.toLowerCase().includes('kg')) {
              totalMeals += qty * 2;
            } else {
              totalMeals += qty;
            }
          });
        });
      }

      setStats({
        available: (availableCount || 0).toString(),
        claimsThisWeek: (claimsCount || 0).toString(),
        mealsServed: Math.round(totalMeals).toLocaleString()
      });
    }

    fetchStats();
  }, [user, isVerified]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-14 border-b bg-card" />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-8" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthorized) return null;

  const orgName = user?.user_metadata?.organization_name || "Organisation";

  // Unverified status: Render ONLY the pending approval message
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader nav={ngoNav} userLabel={orgName.slice(0, 2).toUpperCase()} />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-2xl font-semibold tracking-tight">NGO Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {orgName}.
          </p>

          <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-5">
            <p className="text-sm font-semibold">Account Pending Approval</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Please allow 3-7 working days for our team to validate your application.
              Once verified, your organization will receive a notification and full access to claim donations.
            </p>
            <div className="mt-3 flex gap-3">
              <Link 
                to="/ngo/verification"
                className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                View Status
              </Link>
              <button
                onClick={signOut}
                className="rounded-md border px-4 py-1.5 text-xs font-medium hover:bg-secondary transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Verified status: Full dashboard view with all features unlocked
  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel={orgName.slice(0, 2).toUpperCase()} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">NGO Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {orgName}.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Stat label="Available nearby" value={stats.available} />
          <Stat label="Claims this week" value={stats.claimsThisWeek} />
          <Stat label="Meals served" value={stats.mealsServed} />
        </div>

        <div className="mt-8">
          <Link
            to="/ngo/explore"
            className="inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Explore Available Donations →
          </Link>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}