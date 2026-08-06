import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";
import {
  Package,
  Navigation,
  Star,
  Car,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
} from "lucide-react";
import {
  getSimulatedDriver,
  getDeliveryProgress,
  type DeliveryPhase,
  type SimulatedDriver,
} from "@/lib/delivery-sim";
import { useDeliveryMap } from "@/lib/useDeliveryMap";

export const Route = createFileRoute("/ngo/track/$id")({
  head: () => ({ meta: [{ title: "Track Delivery — SurplusLink" }] }),
  component: TrackDelivery,
});

interface BatchInfo {
  id: string;
  batch_type: string;
  status: string;
  collection_datetime: string | null;
  claimed_at: string | null;
  donor: string;
  pickup: string;
}

// ─────────────────────────────────────────────────────────────────────────────

function TrackDelivery() {
  const { id } = Route.useParams();

  const [batch,      setBatch]      = useState<BatchInfo | null>(null);
  const [ngoAddress, setNgoAddress] = useState("");
  const [ngoName,    setNgoName]    = useState("NGO");
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);

  // Simulation state — driven by a 5-second interval
  const [progress,   setProgress]   = useState(0);
  const [etaMinutes, setEtaMinutes] = useState(45);
  const [phase,      setPhase]      = useState<DeliveryPhase>("preparing");

  // Ensure each DB status update fires only once per session
  const updatedRef = useRef<Set<string>>(new Set());

  // The <div> the map will be rendered into
  const mapRef = useRef<HTMLDivElement>(null);

  // ── 1. Fetch batch data + current NGO's address ───────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);

        // Verify session before calling user/profile endpoints
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && isMounted) {
            const { data: ngo } = await supabase
              .from("ngos")
              .select("organization_name, address")
              .eq("id", user.id)
              .single();

            if (ngo && isMounted) {
              if (ngo.address) setNgoAddress(ngo.address);
              if (ngo.organization_name) setNgoName(ngo.organization_name);
            }
          }
        }

        // Fetch donation batch details
        const { data, error } = await supabase
          .from("donation_batches")
          .select(`
            id,
            batch_type,
            status,
            collection_datetime,
            claimed_at,
            donors (
              organization_name,
              address
            )
          `)
          .eq("id", id)
          .single();

        if (!isMounted) return;

        if (error || !data) {
          setNotFound(true);
        } else {
          const raw = data as any;
          setBatch({
            id: raw.id,
            batch_type: raw.batch_type || "Surplus Food",
            status: raw.status || "Claimed",
            collection_datetime: raw.collection_datetime,
            claimed_at: raw.claimed_at,
            donor: raw.donors?.organization_name || "Anonymous Donor",
            pickup: raw.donors?.address || "Location not specified",
          });
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching delivery tracking details:", err);
          setNotFound(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // ── 2. Progress interval (ticks every 5 s) ────────────────────────────────
  useEffect(() => {
    if (!batch) return;

    // If already delivered, snap to final state immediately
    if (
      batch.status.toLowerCase() === "delivered"
    ) {
      setProgress(1);
      setEtaMinutes(0);
      setPhase("delivered");
      return;
    }

    const tick = () => {
      const result = getDeliveryProgress(
        batch.claimed_at,
        batch.collection_datetime,
      );
      setProgress(result.progress);
      setEtaMinutes(result.etaMinutes);
      setPhase(result.phase);
    };

    tick(); // calculate immediately on mount / batch change
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [batch?.id, batch?.status]);

  // ── 3. Auto-advance DB status when phase thresholds are crossed ───────────
  useEffect(() => {
    if (!batch) return;
    if (batch.status.toLowerCase() === "delivered") return;

    async function maybeUpdate() {
      if (
        (phase === "en_route" || phase === "nearby") &&
        batch!.status.toLowerCase() === "claimed" &&
        !updatedRef.current.has("in_transit")
      ) {
        updatedRef.current.add("in_transit");
        const { error } = await supabase
          .from("donation_batches")
          .update({ status: "In Transit" })
          .eq("id", batch!.id);
        if (!error) setBatch((b) => (b ? { ...b, status: "In Transit" } : b));
      }

      if (
        phase === "delivered" &&
        !updatedRef.current.has("delivered")
      ) {
        updatedRef.current.add("delivered");
        const { error } = await supabase
          .from("donation_batches")
          .update({ status: "Delivered" })
          .eq("id", batch!.id);
        if (!error) setBatch((b) => (b ? { ...b, status: "Delivered" } : b));
      }
    }
    maybeUpdate();
  }, [phase, batch?.id]);

  // ── 4. Map hook ────────────────────────────────────────────────────────────
  const effectiveProgress =
    batch?.status.toLowerCase() === "delivered" ? 1 : progress;

  const { routeReady, distanceText, durationText, geocodeError } =
    useDeliveryMap(
      mapRef as React.RefObject<HTMLDivElement | null>,
      batch?.pickup ?? "",
      ngoAddress,
      effectiveProgress,
      batch?.claimed_at ?? null,
      batch?.collection_datetime ?? null,
    );

  // Driver card data (deterministic from batch ID)
  const driver: SimulatedDriver | null = batch
    ? getSimulatedDriver(batch.id)
    : null;

  const userInitials = ngoName ? ngoName.substring(0, 2).toUpperCase() : "NG";

  // ── Render: loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader nav={ngoNav} userLabel={userInitials} />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="h-5 w-40 rounded bg-muted animate-pulse" />
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.4fr]">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-xl border bg-card animate-pulse" />
              ))}
            </div>
            <div className="h-96 rounded-xl border bg-card animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  // ── Render: not found ──────────────────────────────────────────────────────
  if (notFound || !batch) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader nav={ngoNav} userLabel={userInitials} />
        <main className="mx-auto max-w-5xl px-6 py-10 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm font-medium">Donation not found</p>
          <Link
            to="/ngo/claims"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            ← Back to Claims
          </Link>
        </main>
      </div>
    );
  }

  // ── Render: main ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel={userInitials} />
      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* Back link */}
        <Link
          to="/ngo/claims"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Claims
        </Link>

        {/* Page header */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Track Delivery</h1>
            <p className="text-sm text-muted-foreground capitalize">
              {batch.batch_type} · Batch #{batch.id.toUpperCase().slice(0, 8)} ·{" "}
              from {batch.donor}
            </p>
          </div>
          <StatusChip status={batch.status} />
        </div>

        {/* ETA banner */}
        {phase !== "delivered" ? (
          <div
            className={`mt-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 ${
              phase === "preparing"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : phase === "nearby"
                ? "border-orange-200 bg-orange-50 text-orange-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            <Navigation
              className={`h-4 w-4 shrink-0 ${
                phase !== "preparing" ? "animate-pulse" : ""
              }`}
            />
            <span className="text-sm font-semibold">
              {phase === "preparing"
                ? "Courier is preparing your delivery…"
                : phase === "nearby"
                ? `Courier is nearby — arriving in ${etaMinutes} min`
                : `En route to your organisation — arriving in ${etaMinutes} min`}
            </span>
            {distanceText && (
              <span className="ml-auto shrink-0 text-xs opacity-60">
                {distanceText}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">
              Delivery complete — thank you!
            </span>
          </div>
        )}

        {/* Main 2-column grid */}
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.4fr]">

          {/* ── Left column: status rail + driver card ── */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Delivery Progress
              </p>
              <DeliveryRail phase={phase} />
            </div>

            {driver && <DriverCard driver={driver} />}
          </div>

          {/* ── Right column: live map + batch info ── */}
          <div className="space-y-4">
            {/* Map card */}
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="text-sm font-semibold">Live Delivery Map</p>
                <span className="text-xs text-muted-foreground">
                  {!routeReady && !geocodeError && (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading…
                    </span>
                  )}
                  {routeReady && distanceText && durationText && (
                    <>
                      {distanceText} · {durationText}
                    </>
                  )}
                </span>
              </div>

              {geocodeError ? (
                /* Graceful fallback when geocoding fails */
                <div className="flex h-72 flex-col items-center justify-center gap-3 px-8 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {geocodeError}
                  </p>
                  <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                    {batch.pickup && batch.pickup !== "Location not specified" && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-600" />
                        Pickup: {batch.pickup}
                      </p>
                    )}
                    {ngoAddress && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-blue-600" />
                        Destination: {ngoAddress}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* The map div — Google Maps renders directly into this */
                <div ref={mapRef} style={{ height: "380px" }} className="w-full" />
              )}
            </div>

            {/* Batch info table */}
            <div className="rounded-xl border bg-card p-4 text-sm">
              <InfoRow label="Batch Type" value={batch.batch_type} />
              <InfoRow label="Donor" value={batch.donor} />
              <InfoRow
                label="Collection Deadline"
                value={
                  batch.collection_datetime
                    ? new Date(batch.collection_datetime).toLocaleString(
                        "en-ZA",
                        {
                          weekday: "short",
                          month:   "short",
                          day:     "numeric",
                          hour:    "2-digit",
                          minute:  "2-digit",
                        },
                      )
                    : "Not specified"
                }
              />
              <InfoRow
                label="Pickup Address"
                value={batch.pickup}
                href={
                  batch.pickup && batch.pickup !== "Location not specified"
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(batch.pickup)}`
                    : undefined
                }
              />
              {ngoAddress && (
                <InfoRow
                  label="Your Address"
                  value={ngoAddress}
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ngoAddress)}`}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DeliveryRail({ phase }: { phase: DeliveryPhase }) {
  type S = "done" | "active" | "pending";

  const stages: { label: string; detail: string; state: S }[] = [
    {
      label:  "Order Claimed",
      detail: "Donation successfully claimed",
      state:  "done", // always done once we're on this page
    },
    {
      label:  "Courier En Route",
      detail: "Heading to donor pickup location",
      state:
        phase === "preparing" ? "pending" :
        phase === "en_route"  ? "active"  :
        "done",
    },
    {
      label:  "Courier Nearby",
      detail: "Approaching your organisation",
      state:
        phase === "delivered" ? "done"    :
        phase === "nearby"    ? "active"  :
        "pending",
    },
    {
      label:  "Delivered",
      detail: "Donation received",
      state:  phase === "delivered" ? "done" : "pending",
    },
  ];

  return (
    <div>
      {stages.map((s, i) => (
        <RailStage key={s.label} {...s} isLast={i === stages.length - 1} />
      ))}
    </div>
  );
}

function RailStage({
  label,
  detail,
  state,
  isLast,
}: {
  label: string;
  detail: string;
  state: "done" | "active" | "pending";
  isLast: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      {/* Icon column */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
            state === "done"
              ? "bg-emerald-500 text-white"
              : state === "active"
              ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
              : "border-2 border-muted bg-background text-muted-foreground"
          }`}
        >
          {state === "done" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : state === "active" ? (
            <Navigation className="h-3.5 w-3.5 animate-pulse" />
          ) : (
            <span className="block h-2 w-2 rounded-full bg-muted-foreground/30" />
          )}
        </div>
        {!isLast && (
          <div
            className={`my-0.5 w-0.5 ${
              state === "done" ? "h-9 bg-emerald-400" : "h-9 bg-muted"
            }`}
          />
        )}
      </div>

      {/* Text column */}
      <div className={isLast ? "pb-0" : "pb-1"}>
        <p
          className={`text-sm font-semibold leading-snug ${
            state === "active"
              ? "text-primary"
              : state === "done"
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        >
          {label}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function DriverCard({ driver }: { driver: SimulatedDriver }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Your Driver
      </p>

      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {driver.initials}
        </div>
        <div>
          <p className="text-sm font-semibold">{driver.name}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Car className="h-3 w-3" />
            {driver.vehicle}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold">{driver.rating.toFixed(1)}</span>
          <span className="ml-0.5 text-xs text-muted-foreground">rating</span>
        </div>
        <span className="rounded border bg-muted/50 px-2 py-0.5 font-mono text-xs font-medium tracking-wide">
          {driver.plate}
        </span>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    Claimed:      "bg-blue-100 text-blue-700 border-blue-200",
    "In Transit": "bg-amber-100 text-amber-700 border-amber-200",
    Delivered:    "bg-emerald-100 text-emerald-700 border-emerald-200",
    Cancelled:    "bg-red-100 text-red-600 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        map[status] ?? "bg-muted text-muted-foreground border-muted"
      }`}
    >
      {status}
    </span>
  );
}

function InfoRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b py-1.5 last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-[60%] truncate text-right font-medium text-primary hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="max-w-[60%] truncate text-right font-medium capitalize">
          {value}
        </span>
      )}
    </div>
  );
}