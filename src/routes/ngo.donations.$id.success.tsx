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

  function handleConfirm() {
  if (method === "pickup") {
    navigate({
      to: "/ngo/collection/instructions/$id",
      params: () => ({ id }),
    });
    return;
  }

  if (method === "delivery") {
    alert("Delivery flow coming soon.");
  }
}

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel="HS" />

      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* Success Banner */}

        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm">

          <div className="flex items-center gap-5">

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div>

              <h1 className="text-3xl font-bold text-emerald-800">
                Donation Successfully Claimed
              </h1>

              <p className="mt-2 text-emerald-700">
                Your organisation has successfully reserved this donation.
              </p>

            </div>

          </div>

        </div>

        {/* Donation Details */}

        <div className="mt-8 rounded-2xl border bg-card p-8 shadow-sm">

          <h2 className="mb-6 text-2xl font-semibold">
            Donation Details
          </h2>

          <div className="grid gap-5 md:grid-cols-2">

            <Row
              icon={<Package className="h-5 w-5" />}
              label="Batch ID"
              value={`#${id.toUpperCase().slice(0, 8)}`}
            />

            <Row
              icon={<Package className="h-5 w-5" />}
              label="Batch Type"
              value={batch?.batch_type ?? "Loading..."}
            />

            <Row
              icon={<Building2 className="h-5 w-5" />}
              label="Donor"
              value={batch?.donor ?? "Loading..."}
            />

            <Row
              icon={<Calendar className="h-5 w-5" />}
              label="Pickup Deadline"
              value={deadlineLabel}
            />

          </div>

        </div>

        {/* Pickup Method */}

        <div className="mt-10">

          <h2 className="text-2xl font-semibold">
            How will your organization pick up this donation?
          </h2>

          <p className="mt-2 text-muted-foreground">
            Choose how your organisation will receive this donation.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">

  {/* Pickup Option */}
                      {/* Pickup Option */}

            <button
              type="button"
              onClick={() => setMethod("pickup")}
              className={`cursor-pointer rounded-2xl border p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                method === "pickup"
                  ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between">

                <div>

                  <div className="flex items-center gap-3">

                    <Truck className="h-6 w-6 text-emerald-600" />

                    <h3 className="text-lg font-semibold">
                      We Will Pick It Up
                    </h3>

                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    Your organisation will collect this donation using its own
                    vehicle. Please arrive before the pickup deadline shown
                    above.
                  </p>

                </div>

                {method === "pickup" && (
                  <div className="rounded-full bg-emerald-500 p-1 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                )}

              </div>

            </button>

            {/* Delivery Option */}

            <button
              type="button"
              onClick={() => setMethod("delivery")}
              className={`cursor-pointer rounded-2xl border p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                method === "delivery"
                  ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between">

                <div>

                  <div className="flex items-center gap-3">

                    <MapPin className="h-6 w-6 text-primary" />

                    <h3 className="text-lg font-semibold">
                      Request Delivery
                    </h3>

                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    Request delivery to your organisation if transport is not
                    available. This option can be enabled in a future update.
                  </p>

                </div>

                {method === "delivery" && (
                  <div className="rounded-full bg-emerald-500 p-1 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                )}

              </div>

            </button>

          </div>

        </div>

        {/* Confirmation Section */}

        <div className="mt-8 rounded-xl border bg-muted/30 p-5">

          <h3 className="text-lg font-semibold">
            Confirm Pickup Method
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            After confirming, you'll receive the pickup instructions and be able
            to proceed with collecting this donation.
          </p>

        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">

  <Link
            to="/ngo/dashboard"
            className="flex-1 cursor-pointer rounded-lg border border-border bg-background py-3 text-center font-medium transition-all hover:bg-secondary hover:shadow-md"
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
    <div className="flex items-start gap-4 rounded-xl border bg-background p-5">

      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>

      <div className="flex-1">

        <p className="text-sm text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 font-semibold break-words">
          {value}
        </p>

      </div>

    </div>
  );
}
