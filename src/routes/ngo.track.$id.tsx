import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";
import { Package, MapPin } from "lucide-react";

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

// Derive the pipeline stages from the real status
function deriveStages(batch: BatchInfo) {
  const status = batch.status;

  const claimedAt = batch.claimed_at
    ? new Date(batch.claimed_at).toLocaleString("en-ZA", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })
    : null;

  const deadline = batch.collection_datetime
    ? new Date(batch.collection_datetime).toLocaleString("en-ZA", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })
    : "No deadline";

  const isClaimed   = ["Claimed", "In Transit", "Delivered"].includes(status);
  const isInTransit = ["In Transit", "Delivered"].includes(status);
  const isDelivered = status === "Delivered";

  return [
    {
      label: "Claimed",
      detail: claimedAt ?? "Pending",
      done: isClaimed,
      active: false,
    },
    {
      label: "Pickup Deadline",
      detail: deadline,
      done: isInTransit,
      active: isClaimed && !isInTransit,
    },
    {
      label: "In Transit",
      detail: isInTransit ? "On the way" : "Pending",
      done: isDelivered,
      active: isInTransit && !isDelivered,
    },
    {
      label: "Delivered",
      detail: isDelivered ? "Delivered" : "Pending",
      done: isDelivered,
      active: false,
    },
  ];
}

function TrackDelivery() {
  const { id } = Route.useParams();
  const [batch, setBatch] = useState<BatchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function updateStatus(newStatus: string) {
    if (!batch) return;
    setUpdating(true);
    
    const updates: any = { status: newStatus };

    const { error } = await supabase
      .from("donation_batches")
      .update(updates)
      .eq("id", batch.id);

    if (!error) {
      setBatch({ ...batch, status: newStatus, ...updates });
    }
    setUpdating(false);
  }

  useEffect(() => {
    async function fetchBatch() {
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
      setLoading(false);
    }
    fetchBatch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader nav={ngoNav} userLabel="HS" />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.4fr]">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl border bg-card animate-pulse" />)}
            </div>
            <div className="h-80 rounded-xl border bg-card animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !batch) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader nav={ngoNav} userLabel="HS" />
        <main className="mx-auto max-w-5xl px-6 py-10 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm font-medium">Donation not found</p>
          <Link to="/ngo/claims" className="mt-3 inline-block text-sm text-primary hover:underline">
            ← Back to Claims
          </Link>
        </main>
      </div>
    );
  }

  const stages = deriveStages(batch);

  const mapsUrl = batch.pickup && batch.pickup !== "Location not specified"
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(batch.pickup)}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel="HS" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/ngo/claims" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Claims
        </Link>

        <div className="mt-4">
          <h1 className="text-xl font-semibold">Track Delivery</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {batch.batch_type} · Batch #{batch.id.toUpperCase().slice(0, 8)} · from {batch.donor}
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.4fr]">
          {/* Progress stages */}
          <div className="space-y-3">
            {stages.map((s) => (
              <Stage key={s.label} label={s.label} detail={s.detail} done={s.done} active={s.active} />
            ))}

            {/* Current status chip */}
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Current Status</p>
                  <StatusChip status={batch.status} />
                </div>
              </div>

              {batch.status === "Claimed" && (
                <button
                  onClick={() => updateStatus("In Transit")}
                  disabled={updating}
                  className="mt-4 w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {updating ? "Updating..." : "Mark as Picked Up (In Transit)"}
                </button>
              )}
              
              {batch.status === "In Transit" && (
                <button
                  onClick={() => updateStatus("Delivered")}
                  disabled={updating}
                  className="mt-4 w-full rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {updating ? "Updating..." : "Mark as Delivered"}
                </button>
              )}
            </div>
          </div>

          {/* Pickup location card */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="p-4 border-b">
                <p className="text-sm font-semibold">Pickup Location</p>
              </div>
              <div
                className="flex flex-col items-center justify-center h-64 gap-3"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, oklch(0.95 0.01 247) 0%, oklch(0.92 0.02 200) 100%)",
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <p className="max-w-xs text-center text-sm font-medium px-4">
                  {batch.pickup}
                </p>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Open in Google Maps →
                  </a>
                )}
              </div>
            </div>

            {/* Batch info */}
            <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
              <Row label="Batch Type" value={batch.batch_type} />
              <Row label="Donor" value={batch.donor} />
              <Row
                label="Collection Deadline"
                value={
                  batch.collection_datetime
                    ? new Date(batch.collection_datetime).toLocaleString("en-ZA", {
                        weekday: "short", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })
                    : "Not specified"
                }
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    Claimed:    "bg-blue-100 text-blue-700",
    "In Transit": "bg-amber-100 text-amber-700",
    Delivered:  "bg-emerald-100 text-emerald-700",
    Cancelled:  "bg-red-100 text-red-600",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function Stage({ label, detail, done, active }: { label: string; detail: string; done?: boolean; active?: boolean }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors ${active ? "border-primary/40 bg-primary/5" : ""}`}>
      <div
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
          done
            ? "bg-emerald-100 text-emerald-700"
            : active
              ? "bg-primary/20 text-primary"
              : "bg-secondary text-muted-foreground"
        }`}
      >
        {done ? "✓" : active ? "•" : "○"}
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-1.5 last:border-0 gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}
