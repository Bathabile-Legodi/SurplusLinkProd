import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/ngo/donations/$id/success")({
  head: () => ({ meta: [{ title: "Donation Claimed — SurplusLink" }] }),
  component: ClaimSuccess,
});

interface BatchSummary {
  batch_type: string;
  donor: string;
  collection_datetime: string | null;
}

function ClaimSuccess() {
  const { id } = Route.useParams();
  const [batch, setBatch] = useState<BatchSummary | null>(null);

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
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel="HS" />
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <span className="text-2xl text-emerald-600">✓</span>
        </div>
        <h1 className="mt-6 text-xl font-semibold">Donation Successfully Claimed!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your organisation has been assigned this donation batch.
        </p>

        <div className="mt-6 rounded-xl border bg-card p-5 text-left text-sm">
          <Row label="Batch ID" value={batch ? `#${id.toUpperCase().slice(0, 8)}` : "Loading…"} />
          <Row label="Batch Type" value={batch?.batch_type ?? "—"} />
          <Row label="Donor" value={batch?.donor ?? "—"} />
          <Row label="Pickup Deadline" value={deadlineLabel} />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Please proceed to the donor location before the pickup deadline. The donor has been notified.
        </p>

        <div className="mt-6 flex gap-3">
          <Link to="/ngo/dashboard" className="flex-1 rounded-md border py-2 text-sm hover:bg-secondary transition-colors">
            Back to Dashboard
          </Link>
          <Link
            to="/ngo/track/$id"
            params={{ id }}
            className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Track Delivery →
          </Link>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
