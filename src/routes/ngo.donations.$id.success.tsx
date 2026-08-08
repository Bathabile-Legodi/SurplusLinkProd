import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Package,
  Calendar,
  Building2,
  Truck,
  MapPin,
  Check,
} from "lucide-react";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/ngo/donations/$id/success")({
  head: () => ({
    meta: [{ title: "Donation Claimed — SurplusLink" }],
  }),
  component: ClaimSuccess,
});

interface BatchSummary {
  batch_type: string;
  donor: string;
  collection_datetime: string | null;
}

function ClaimSuccess() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState<BatchSummary | null>(null);
  const [method, setMethod] = useState<"pickup" | "delivery" | null>(null);

  useEffect(() => {
    async function fetchBatch() {
      const { data, error } = await supabase
        .from("donation_batches")
        .select(`
          batch_type,
          collection_datetime,
          donors (
            organization_name
          )
        `)
        .eq("id", id)
        .single();

      if (!error && data) {
        const raw = data as any;

        setBatch({
          batch_type: raw.batch_type || "Surplus Food",
          donor: raw.donors?.organization_name || "Anonymous Donor",
          collection_datetime: raw.collection_datetime,
        });
      }
    }

    fetchBatch();
  }, [id]);

  const deadlineLabel = batch?.collection_datetime
    ? new Date(batch.collection_datetime).toLocaleString("en-ZA", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  async function handleConfirm() {
    if (!method) return;

    // Best-effort: persist collection_type for future use (column may not exist yet)
    try {
      await supabase
        .from("donation_batches")
        .update({ collection_type: method })
        .eq("id", id);
    } catch (err) {
      console.warn("[handleConfirm] collection_type update failed (column may not exist yet):", err);
    }

    if (method === "pickup") {
      // @ts-ignore - Route params type bug
      navigate({
        to: "/ngo/collection/instructions/$id",
        params: { id },
      });
      return;
    }

    if (method === "delivery") {
      navigate({ to: "/ngo/claims" });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel="HS" />

      <main className="mx-auto max-w-3xl px-6 py-10">

        {/* Success banner */}
        <div className="mb-8 flex items-center gap-4 rounded-xl border bg-card px-5 py-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-[color:var(--success)]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Donation Successfully Claimed</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your organisation has successfully reserved this donation.
            </p>
          </div>
        </div>

        {/* Donation details */}
        <section className="mb-6 rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="text-sm font-semibold">Donation Details</h2>
          </div>
          <div className="grid gap-px bg-border sm:grid-cols-2">
            {[
              { label: "Batch ID", value: `#${id.toUpperCase().slice(0, 8)}` },
              { label: "Batch Type", value: batch?.batch_type ?? "Loading…" },
              { label: "Donor", value: batch?.donor ?? "Loading…" },
              { label: "Pickup Deadline", value: deadlineLabel },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pickup method */}
        <section className="mb-6 rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="text-sm font-semibold">Collection Method</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Choose how your organisation will receive this donation.</p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {/* Self-collect */}
            <button
              type="button"
              onClick={() => setMethod("pickup")}
              className={[
                "rounded-xl border p-4 text-left transition-all duration-150 hover:shadow-sm",
                method === "pickup"
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-secondary/40 hover:bg-secondary",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold">We Will Pick It Up</span>
                </div>
                {method === "pickup" && (
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Your organisation will collect using its own vehicle. Arrive before the pickup deadline.
              </p>
            </button>

            {/* Delivery */}
            <button
              type="button"
              onClick={() => setMethod("delivery")}
              className={[
                "rounded-xl border p-4 text-left transition-all duration-150 hover:shadow-sm",
                method === "delivery"
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-secondary/40 hover:bg-secondary",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold">Request Delivery</span>
                </div>
                {method === "delivery" && (
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Request delivery to your organisation if transport is unavailable. Coming soon.
              </p>
            </button>
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            to="/ngo/dashboard"
            className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-secondary transition-colors"
          >
            ← Dashboard
          </Link>
          <button
            type="button"
            disabled={!method}
            onClick={handleConfirm}
            className="flex-1 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Confirm →
          </button>
        </div>

      </main>
    </div>
  );
}