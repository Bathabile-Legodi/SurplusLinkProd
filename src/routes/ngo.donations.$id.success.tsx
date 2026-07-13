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
import { updateDonationStatus } from "@/lib/donations";
import { supabase } from "@/lib/supabase";
import { getRealDrivingDistance } from "./ngo.donations.$id"; // Reuses your distance calculation engine

export const Route = createFileRoute("/ngo/donations/$id/success")({
  head: () => ({
    meta: [{ title: "Donation Claimed — SurplusLink" }],
  }),
  component: ClaimSuccess,
});

function ClaimSuccess() {
  const { id } = Route.useParams();
  const [batch, setBatch] = useState<BatchSummary | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function processClaimAndFetchData() {
      try {
        // 1. Database State Update: Ensure the record is transitioned securely to "Claimed"
        if (id) {
          // Attempt using the utility wrapper
          await updateDonationStatus(id, "Claimed");
          
          // Direct fallback patch step verifying state persistence directly inside table schema
          await supabase
            .from("donation_batches")
            .update({ status: "Claimed" })
            .eq("id", id);
        }

        // 2. Fetch User Identity Profiles & Address for maps metrics engine
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;

        let ngoAddress = "";
        if (user) {
          const { data: ngoProfile } = await supabase
            .from("ngos")
            .select("organization_name, address")
            .eq("id", user.id)
            .single();
            
          if (ngoProfile && isMounted) {
            ngoAddress = ngoProfile.address || "";
            if (ngoProfile.organization_name) {
              setNgoInitials(ngoProfile.organization_name.substring(0, 2).toUpperCase());
            }
          }
        }

        // 3. Query matching data pipelines to pull raw parameters for the dynamic success receipt block
        const { data, error } = await supabase
          .from("donation_batches")
          .select(`
            collection_datetime,
            donors (
              organization_name,
              address
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
            ← Back to Dashboard
          </Link>

          <button
            type="button"
            disabled={!method}
            onClick={handleConfirm}
            className={`flex-1 rounded-lg py-3 font-semibold transition-all ${
              method
                ? "cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            Confirm →
          </button>

        </div>

      </main>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between border-b py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}