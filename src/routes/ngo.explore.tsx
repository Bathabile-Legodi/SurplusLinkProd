import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { supabase } from "@/lib/supabase"; 

export const Route = createFileRoute("/ngo/explore")({
  head: () => ({ meta: [{ title: "Explore Donations — SurplusLink" }] }),
  component: ExplorePage,
});

interface DonationUI {
  id: string;
  title: string;
  quantity: string;
  pickup: string;
  donor: string;
  distance: string;
  status: string; // Stored to allow filter manipulation
}

function calculateDistance(donorAddress: string, ngoAddress: string): string {
  if (!donorAddress || !ngoAddress) return "Distance unknown";
  return "1.5 km away"; 
}

function ExplorePage() {
  const [rawDonations, setRawDonations] = useState<DonationUI[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("Unclaimed");
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Fetch data on component load
  useEffect(() => {
    async function fetchDonations() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("donation_batches")
          .select(`
            id,
            donor_id,
            batch_type,
            collection_datetime,
            status,
            claimed_by,
            donors (
              organization_name,
              address
            ),
            ngos!donation_batches_claimed_by_fkey (
              address
            )
          `); 

        if (error) throw error;

        if (data) {
          const formattedData: DonationUI[] = data.map((batch: any) => {
            const donorAddress = batch.donors?.address || "";
            const ngoAddress = batch.ngos?.address || "";
            
            return {
              id: batch.id,
              title: batch.batch_type || "General Batch",
              quantity: "0", 
              pickup: donorAddress || "Not specified",
              donor: batch.donors?.organization_name || "Anonymous Donor",
              distance: calculateDistance(donorAddress, ngoAddress),
              status: batch.status || "Unclaimed"
            };
          });

          setRawDonations(formattedData);
        }
      } catch (error) {
        console.error("Error fetching donations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDonations();
  }, []);

  // 2. Client-Side Computed Filtering Logic
  const filteredDonations = rawDonations.filter((donation) => {
    // Exact status mapping matching state selection
    const matchesStatus = donation.status.toLowerCase() === selectedStatus.toLowerCase();

    // Standardized global search across title, donor, and pickup location text fields
    const cleanQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      cleanQuery === "" ||
      donation.title.toLowerCase().includes(cleanQuery) ||
      donation.donor.toLowerCase().includes(cleanQuery) ||
      donation.pickup.toLowerCase().includes(cleanQuery);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel="HS" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, Hope Shelter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's surplus food from verified donors near you.
        </p>

        {/* Search Bar Row */}
        <div className="relative mt-6 flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search donations by title, donor or pickup location..."
            className="flex-1 rounded-md border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button 
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-md border px-4 py-2 text-sm transition-colors hover:bg-secondary ${showFilters ? "bg-secondary border-primary/40" : "bg-card"}`}
          >
            Filters
          </button>

          {/* Collapsible Micro Dropdown Modal for Status Filters */}
          {showFilters && (
            <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-md border bg-popover p-2 shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
              <label className="block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Batch Status</label>
              <div className="mt-1 flex flex-col gap-1">
                {["Unclaimed"].map((statusOption) => (
                  <button
                    key={statusOption}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(statusOption);
                      setShowFilters(false); // Autoclose panel on toggle selection
                    }}
                    className={`w-full rounded px-2 py-1.5 text-left text-xs font-medium transition-colors ${selectedStatus === statusOption ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
                  >
                    {statusOption}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <h2 className="mt-8 mb-3 text-sm font-semibold">
          Available Donations Near You ({filteredDonations.length})
        </h2>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading available donations...</div>
        ) : filteredDonations.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            No donations matching "{searchQuery || selectedStatus}" found.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredDonations.map((d) => (
              <Link
                key={d.id}
                to="/ngo/donations/$id"
                params={{ id: d.id }}
                className="rounded-xl border bg-card p-5 transition hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{d.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium
                    ${d.status === "Unclaimed" ? "bg-emerald-500/10 text-emerald-600" : ""}
                    ${d.status === "Claimed" ? "bg-blue-500/10 text-blue-600" : ""}
                    ${d.status === "Expired" ? "bg-destructive/10 text-destructive" : ""}
                  `}>
                    {d.status}
                  </span>
                </div>
                <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <dt>Quantity</dt>
                    <dd className="text-foreground">{d.quantity}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt>Pickup at</dt>
                    <dd className="rounded-md border border-blue-100 bg-blue-50/50 px-2 py-0.5 font-medium text-blue-900 max-w-[70%] truncate">
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