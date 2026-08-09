import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";
import { Package, ArrowRight, CheckCircle2, Clock, Truck, MapPin, Eye } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/ngo/claims")({
  beforeLoad: () => requireRole("ngo"),
  head: () => ({ meta: [{ title: "My Claimed Donations — SurplusLink" }] }),
  component: MyClaims,
});

interface ClaimedBatch {
  id: string;
  batch_type: string;
  status: string;
  collection_datetime: string | null;
  claimed_at: string | null;
  collection_type: string | null;
  donor: string;
  pickup: string;
}

function statusMeta(status: string) {
  switch (status.toLowerCase()) {
    case "claimed":
      return { label: "Claimed", cls: "bg-blue-100 text-blue-700 border-blue-200" };
    case "delivered":
      return { label: "Delivered", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    case "cancelled":
      return { label: "Cancelled", cls: "bg-red-100 text-red-600 border-red-200" };
    default:
      return { label: status, cls: "bg-neutral-100 text-neutral-500 border-neutral-200" };
  }
}

function MyClaims() {
  const { initials } = useAuth();
  const [claims, setClaims] = useState<ClaimedBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClaims() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("donation_batches")
        .select(`
          id,
          batch_type,
          status,
          collection_datetime,
          claimed_at,
          collection_type,
          donors (
            organization_name,
            address
          )
        `)
        .eq("claimed_by", user.id)
        .order("claimed_at", { ascending: false });

      if (error) {
        console.error("[MyClaims] Supabase fetch error:", error);
      }

      if (data) {
        setClaims(data.map((b: any) => ({
          id: b.id,
          batch_type: b.batch_type || "Surplus Food",
          status: b.status || "claimed",
          collection_datetime: b.collection_datetime,
          claimed_at: b.claimed_at,
          collection_type: b.collection_type || null,
          donor: b.donors?.organization_name || "Anonymous Donor",
          pickup: b.donors?.address || "Location not specified",
        })));
      }
      setLoading(false);
    }
    fetchClaims();
  }, []);

  // Normalise to lowercase for comparison so "claimed" and "Claimed" both match
  const active = claims.filter((c) => c.status.toLowerCase() === "claimed");
  const completed = claims.filter((c) => c.status.toLowerCase() !== "claimed");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel={initials} />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">My Claimed Donations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track the donations your organisation has claimed.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : claims.length === 0 ? (
          <div className="rounded-xl border bg-card py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No claimed donations yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Go explore available donations near you.</p>
            <Link
              to="/ngo/explore"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Explore Donations
            </Link>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Active Claims ({active.length})
                </h2>
                <ul className="space-y-3">
                  {active.map((c) => (
                    <ClaimCard key={c.id} claim={c} />
                  ))}
                </ul>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Completed ({completed.length})
                </h2>
                <ul className="space-y-3">
                  {completed.map((c) => (
                    <ClaimCard key={c.id} claim={c} />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ClaimCard({ claim }: { claim: ClaimedBatch }) {
  const { label, cls } = statusMeta(claim.status);

  const deadline = claim.collection_datetime
    ? new Date(claim.collection_datetime).toLocaleString("en-ZA", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "No deadline set";

  const isSelfCollect = claim.collection_type === "pickup";

  return (
    <li className="flex items-center justify-between rounded-xl border bg-card p-4 gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Package className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium capitalize truncate">{claim.batch_type}</p>
            {isSelfCollect && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border">
                <Truck className="h-2.5 w-2.5" /> Self-collect
              </span>
            )}
            {claim.collection_type === "delivery" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border">
                <MapPin className="h-2.5 w-2.5" /> Delivery
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{claim.donor} · Pickup by {deadline}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
          {label}
        </span>
        {claim.collection_type === 'pickup' ? (
          <Link
            to="/ngo/collection/instructions/$id"
            params={{ id: claim.id }}
            search={{ from: 'claims' }}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Eye className="h-3 w-3" /> View
          </Link>
        ) : (
          <Link
            to="/ngo/track/$id"
            params={{ id: claim.id }}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Eye className="h-3 w-3" /> View
          </Link>
        )}
      </div>
    </li>
  );
}
