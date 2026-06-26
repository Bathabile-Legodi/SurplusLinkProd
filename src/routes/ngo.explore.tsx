import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { supabase } from "@/lib/supabase"; 

export const Route = createFileRoute("/ngo/explore")({
  head: () => ({ meta: [{ title: "Explore Donations — SurplusLink" }] }),
  component: ExplorePage,
});

// Define an interface for the formatted UI structure
interface DonationUI {
  id: string;
  title: string;
  quantity: string;
  pickup: string;
  donor: string;
  distance: string;
}

// A placeholder helper to handle distance string calculation
function calculateDistance(donorAddress: string, ngoAddress: string): string {
  if (!donorAddress || !ngoAddress) return "Distance unknown";
  // Once you add lat/long coordinates to your tables, you can use the Haversine formula here.
  // For now, it dynamically acknowledges that it has both addresses.
  return "1.5 km away"; 
}

function ExplorePage() {
  const [donations, setDonations] = useState<DonationUI[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUnclaimedDonations() {
      try {
        setLoading(true);
        
        // Query donation_batches with its 3 foreign keys
        const { data, error } = await supabase
          .from("donation_batches")
          .select(`
            id,
            status,
            batch_type,
            ngos (
              address
            ),
            donors (
              organization_name,
              address
            ),
            donation_items (
              quantity,
              expiry
            )
          `)
          .eq("status", "Unclaimed");

        if (error) throw error;

        console.log("Raw response data from Supabase:", data);
        console.log("Number of items returned:", data?.length);

        if (data) {
          // Transform the database results into the exact format your UI expects
          const formattedData: DonationUI[] = data.map((batch: any) => {
            const donorAddress = batch.donors?.address || "";
            const ngoAddress = batch.ngos?.address || "";
            
            return {
              id: batch.id,
              title: batch.batch_type,
              quantity: batch.donation_items?.quantity || "N/A",
              pickup: donorAddress || "Not specified",
              donor: batch.donors?.organization_name || "Anonymous Donor",
              distance: calculateDistance(donorAddress, ngoAddress),
            };
          });

          console.log("Formatted data ready for state:", formattedData);
          setDonations(formattedData);
        }
      } catch (error) {
        console.error("Error fetching donations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUnclaimedDonations();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel="HS" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, Hope Shelter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's surplus food from verified donors near you.
        </p>

        <div className="mt-6 flex gap-3">
          <input
            placeholder="Search donations by category, donor or location..."
            className="flex-1 rounded-md border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button className="rounded-md border bg-card px-4 py-2 text-sm hover:bg-secondary">
            Filters
          </button>
        </div>

        <h2 className="mt-8 mb-3 text-sm font-semibold">Available Donations Near You</h2>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading available donations...</div>
        ) : donations.length === 0 ? (
          <div className="text-sm text-muted-foreground">No unclaimed donations available right now.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {donations.map((d) => (
              <Link
                key={d.id}
                to="/ngo/donations/$id"
                params={{ id: d.id }}
                className="rounded-xl border bg-card p-5 transition hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{d.title}</h3>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-[color:var(--success)]">
                    Available
                  </span>
                </div>
                <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <dt>Quantity</dt>
                    <dd className="text-foreground">{d.quantity}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Pickup at</dt>
                    <dd className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 font-semibold text-blue-900">
                      {d.pickup}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Donor</dt>
                    <dd className="text-foreground">{d.donor}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Distance</dt>
                    <dd className="text-foreground">{d.distance}</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}