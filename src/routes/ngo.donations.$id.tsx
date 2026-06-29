import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { supabase } from "@/lib/supabase"; 

export const Route = createFileRoute("/ngo/donations/$id")({
  head: () => ({ meta: [{ title: "Donation Details — SurplusLink" }] }),
  component: DonationDetail,
});

// Defining the exact layout fields you requested to save 
interface DonationDetailState {
  id: string;
  quantity: string;
  collection_datetime: string; // Expiry date mapped field
  donor: string;
  pickup: string;             // Location mapped field
  batch_type: string;
}

function DonationDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [batch, setBatch] = useState<DonationDetailState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Use the database setup from explore page to pull this specific batch
  useEffect(() => {
    async function fetchBatchDetail() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("donation_batches")
          .select(`
            id,
            batch_type,
            collection_datetime,
            status,
            donors (
              organization_name,
              address
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          // 1. Cast data to bypass the strict relation type structure
          const rawBatch = data as any;
          // 2. Check if donors is wrapped in an array or returned directly
          const donorInfo = Array.isArray(rawBatch.donors) 
            ? rawBatch.donors[0] 
            : rawBatch.donors;
          // Saving explicitly to your exact layout specifications
          setBatch({
          id: rawBatch.id,
          quantity: "0", 
          collection_datetime: rawBatch.collection_datetime ? new Date(rawBatch.collection_datetime).toLocaleString() : "N/A",
          donor: donorInfo?.organization_name || "Anonymous Donor",
          pickup: donorInfo?.address || "Location not specified", 
          batch_type: rawBatch.batch_type || "Surplus Food"
        });
        }
      } catch (err) {
        console.error("Error fetching donation details:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBatchDetail();
  }, [id]);

  // Check if we're on a child route
  const isChildRoute = location.pathname !== `/ngo/donations/${id}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader nav={ngoNav} userLabel="HS" />
        <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted-foreground">
          Loading donation details...
        </main>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader nav={ngoNav} userLabel="HS" />
        <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted-foreground">
          Donation batch not found.
          <div className="mt-4">
            <Link to="/ngo/explore" className="text-primary hover:underline">← Back to Explore</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      {!isChildRoute && (
        <div className="min-h-screen bg-background">
          <AppHeader nav={ngoNav} userLabel="HS" />
          <main className="mx-auto max-w-3xl px-6 py-10">
            <Link to="/ngo/explore" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Available Donations
            </Link>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="aspect-square rounded-xl border bg-secondary flex items-center justify-center text-xs text-muted-foreground uppercase font-semibold tracking-wider p-4 text-center">
                {batch.batch_type}
              </div>
              <div>
                <h1 className="text-xl font-semibold capitalize">{batch.batch_type}</h1>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label="Quantity" value={batch.quantity} />
                  <Row label="Expiry Time" value={batch.collection_datetime} />
                  <Row label="Donor" value={batch.donor} />
                  <Row label="Location" value={batch.pickup} highlight />
                </dl>
              </div>
            </div>

            <section className="mt-8 rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold">About This Donation</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                This donation include {batch.batch_type}. Donation must be collected before {batch.collection_datetime} - quality checked and ready for distribution.
              </p>
            </section>

            <button
              type="button"
              onClick={() => navigate({ to: `/ngo/donations/${id}/claim` })}
              className="mt-6 w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Claim Donation
            </button>
          </main>
        </div>
      )}
      <Outlet />
    </>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between border-b py-1.5 gap-4">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className={highlight ? "rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 font-semibold text-blue-900 truncate max-w-[70%]" : "font-medium text-right truncate max-w-[70%]"}>
        {value}
      </dd>
    </div>
  );
}