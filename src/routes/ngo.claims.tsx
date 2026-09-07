import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, ngoNav } from "@/components/AppHeader"; // kept for type compat — unused after migration
import { ngoSidebarNav } from "@/lib/nav";
import { supabase } from "@/lib/supabase";
import {
  Package,
  ArrowRight,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Eye,
  XCircle,
  Navigation,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/ngo/claims")({
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

// ─── Status helpers ───────────────────────────────────────────────────────────

/**
 * "Active" = the claim is still in progress and requires attention.
 * Includes: claimed (awaiting collection) AND in_transit / in-transit (en route).
 */
function isActive(status: string) {
  const s = status.toLowerCase().replace("-", "_");
  return s === "claimed" || s === "in_transit" || s === "in progress" || s === "in_progress";
}

/**
 * "Completed" = the lifecycle is finished — delivered OR cancelled.
 * Explicitly excludes in-transit so items still moving are never shown here.
 */
function isCompleted(status: string) {
  const s = status.toLowerCase();
  return s === "delivered" || s === "cancelled";
}

function statusMeta(status: string, isDelivery: boolean = false) {
  const s = status.toLowerCase().replace("-", "_");
  switch (s) {
    case "claimed":
      return {
        label: isDelivery ? "Awaiting Delivery" : "Awaiting Collection",
        cls: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <Clock className="h-3 w-3" />,
      };
    case "in_transit":
    case "in progress":
    case "in_progress":
      return {
        label: isDelivery ? "In Transit" : "In Progress",
        cls: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Navigation className="h-3 w-3" />,
      };
    case "delivered":
      return {
        label: "Delivered",
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 className="h-3 w-3" />,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        cls: "bg-red-50 text-red-600 border-red-200",
        icon: <XCircle className="h-3 w-3" />,
      };
    default:
      return {
        label: status,
        cls: "bg-neutral-100 text-neutral-500 border-neutral-200",
        icon: null,
      };
  }
}

function formatDateTime(dt: string | null) {
  if (!dt) return "No deadline set";
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(dt));
}

// ─── Component ───────────────────────────────────────────────────────────────

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
          donors!donor_id (
            organization_name,
            address
          )
        `)
        .eq("claimed_by", user.id)
        .order("claimed_at", { ascending: false });

      if (error) console.error("[MyClaims] fetch error:", error);

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

  const active    = claims.filter((c) => isActive(c.status));
  const completed = claims.filter((c) => isCompleted(c.status));
  // anything else (unknown statuses) stays hidden — not shown in completed

  return (
    <>
      <main className="relative mx-auto max-w-4xl px-6 py-10">
        {/* Page header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Claimed Donations</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track everything your organisation has claimed, in one place.
            </p>
          </div>
          <Link
            to="/ngo/explore"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:-translate-y-0.5 shrink-0"
          >
            Explore Donations
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : claims.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            {/* ── Active ── */}
            <section>
              <SectionHeader
                icon={<Clock className="h-4 w-4 text-blue-600" />}
                label="Active Claims"
                count={active.length}
                colorClass="bg-blue-50 border-blue-200 text-blue-700"
                description="Awaiting collection or currently in transit"
              />
              {active.length === 0 ? (
                <EmptySection message="No active claims right now." />
              ) : (
                <ul className="space-y-3">
                  {active.map((c) => <ClaimCard key={c.id} claim={c} />)}
                </ul>
              )}
            </section>

            {/* ── Completed ── */}
            <section>
              <SectionHeader
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                label="Completed"
                count={completed.length}
                colorClass="bg-emerald-50 border-emerald-200 text-emerald-700"
                description="Delivered or cancelled — fully resolved"
              />
              {completed.length === 0 ? (
                <EmptySection message="No completed claims yet." />
              ) : (
                <ul className="space-y-3">
                  {completed.map((c) => <ClaimCard key={c.id} claim={c} muted />)}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon, label, count, colorClass, description,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  colorClass: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${colorClass}`}>
          {icon} {label}
        </span>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
          {count}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

// ─── Claim card ───────────────────────────────────────────────────────────────

function ClaimCard({ claim, muted }: { claim: ClaimedBatch; muted?: boolean }) {
  const isPickup = claim.collection_type === "pickup";
  const isDelivery = claim.collection_type === "delivery";
  const { label, cls, icon: statusIcon } = statusMeta(claim.status, isDelivery);
  const deadline = formatDateTime(claim.collection_datetime);

  return (
    <li className={`rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/8 ${muted ? "glass opacity-80" : "glass"}`}
      style={{ boxShadow: "0 4px 16px oklch(0.18 0.16 264 / 0.07)" }}>
      <div className="flex items-stretch gap-0">

        {/* Collection type stripe */}
        <div className={`w-1.5 rounded-l-2xl shrink-0 ${isPickup ? "bg-primary" : isDelivery ? "bg-amber-400" : "bg-neutral-300"}`} />

        <div className="flex flex-1 flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between min-w-0">
          {/* Left: icon + details */}
          <div className="flex items-center gap-4 min-w-0">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${isPickup ? "bg-primary/10 border-primary/15 text-primary" : isDelivery ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-secondary text-muted-foreground border-border"}`}>
              {isPickup ? <Truck className="h-5 w-5" /> : isDelivery ? <MapPin className="h-5 w-5" /> : <Package className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              {/* Collection type label */}
              <div className="mb-1 flex items-center gap-2 flex-wrap">
                <p className="font-semibold capitalize">{claim.batch_type}</p>
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide border ${isPickup ? "bg-primary/8 text-primary border-primary/15" : isDelivery ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-secondary text-muted-foreground border-border"}`}>
                  {isPickup ? <><Truck className="h-2.5 w-2.5" /> Self-collect</> : isDelivery ? <><MapPin className="h-2.5 w-2.5" /> Delivery</> : "—"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                From <span className="font-medium text-foreground">{claim.donor}</span>
                {" · "}
                {isPickup ? "Pickup by" : "Delivery by"} {deadline}
              </p>
            </div>
          </div>

          {/* Right: status + action */}
          <div className="flex items-center gap-3 shrink-0">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
              {statusIcon} {label}
            </span>
            {isPickup ? (
              <Link
                to="/ngo/collection/instructions/$id"
                params={{ id: claim.id }}
                search={{ from: "claims" }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg"
              >
                <Eye className="h-3 w-3" /> View
              </Link>
            ) : (
              <Link
                to="/ngo/track/$id"
                params={{ id: claim.id }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg"
              >
                <Eye className="h-3 w-3" /> Track
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

// ─── Empty states ─────────────────────────────────────────────────────────────

function EmptySection({ message }: { message: string }) {
  return (
    <div className="glass rounded-2xl px-6 py-6 text-center text-sm text-muted-foreground border border-dashed border-border/60">
      {message}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass rounded-2xl py-20 text-center" style={{ boxShadow: "0 4px 16px oklch(0.18 0.16 264 / 0.07)" }}>
      <Package className="mx-auto h-10 w-10 text-muted-foreground/30" />
      <p className="mt-4 text-sm font-semibold">No claimed donations yet</p>
      <p className="mt-1 text-xs text-muted-foreground">Explore available donations near your organisation.</p>
      <Link
        to="/ngo/explore"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
      >
        Explore Donations <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
