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
  status: string;
  created_at?: string;
  collection_datetime: string | null;
}

// 1. Google Maps Script Loader Management Hook
function useGoogleMaps() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ((window as any).google?.maps?.places) {
      setReady(true);
      return;
    }

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => setReady(true));
      return;
    }

    (window as any).initGoogleMaps = () => setReady(true);

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      delete (window as any).initGoogleMaps;
    };
  }, []);

  return ready;
}

// 2. Batch Matrix Driving Distance Resolution Engine
export function getBatchDrivingDistances(
  origin: string,
  destinations: string[]
): Promise<string[]> {
  return new Promise((resolve) => {
    if (!(window as any).google?.maps || !origin || destinations.length === 0) {
      resolve(destinations.map(() => "Distance unavailable"));
      return;
    }

    const service = new (window as any).google.maps.DistanceMatrixService();

    // Clean empty values to prevent API request crashes
    const validDestinations = destinations.map(d => d.trim() === "" ? "Unknown Location" : d);

    try {
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: validDestinations,
          travelMode: (window as any).google.maps.TravelMode.DRIVING,
          unitSystem: (window as any).google.maps.UnitSystem.METRIC,
        },
        (response: any, status: string) => {
          if (status === "OK" && response.rows[0]?.elements) {
            const distances = response.rows[0].elements.map((element: any) => {
              if (element.status === "OK") {
                return `${element.distance.text} away`;
              }
              return "Distance unknown";
            });
            resolve(distances);
          } else {
            console.error("Distance Matrix batch collection failed:", status);
            resolve(destinations.map(() => "Distance error"));
          }
        }
      );
    } catch (e) {
      console.error("Failed executing distance matrix operation", e);
      resolve(destinations.map(() => "Distance error"));
    }
  });
}

function ExplorePage() {
  const isMapsReady = useGoogleMaps();
  const [rawDonations, setRawDonations] = useState<DonationUI[]>([]);
  const [distancesMap, setDistancesMap] = useState<Record<string, string>>({});
  const [ngoAddress, setNgoAddress] = useState<string>("");
  const [ngoName, setNgoName] = useState<string>("NGO");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSort, setShowSort] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch base records from Supabase & user profile
  useEffect(() => {
    async function fetchDonationsAndProfile() {
      try {
        setLoading(true);
        
        // A. Get Authenticated User context
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Fetch current NGO details dynamically matching auth user id
          const { data: ngoProfile } = await supabase
            .from("ngos")
            .select("id, organization_name, address") // Fixed column spelling
            .eq("id", user.id)
            .single();

          if (ngoProfile) {
            setNgoAddress(ngoProfile.address || "");
            setNgoName(ngoProfile.organization_name || "Hope Shelter");
          }
        }

        // B. Fetch batches from database
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
            )
          `)
          .limit(10); 

        if (error) throw error;

        if (data) {
          const formattedData: DonationUI[] = data.map((batch: any) => {
            const donorAddress = batch.donors?.address || "";
            return {
              id: batch.id,
              title: batch.batch_type || "General Batch",
              quantity: "1 Batch", 
              pickup: donorAddress || "Location not specified",
              donor: batch.donors?.organization_name || "Anonymous Donor",
              distance: "Calculating...",
              status: batch.status || "Unclaimed",
              created_at: batch.created_at,
              collection_datetime: batch.collection_datetime
            };
          });

          setRawDonations(formattedData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDonationsAndProfile();
  }, []);

  // Compute asynchronous distances collectively when Maps are ready
  useEffect(() => {
    if (!isMapsReady || rawDonations.length === 0 || !ngoAddress) return;

    async function appendDistances() {
      const destinationsList = rawDonations.map((d) => 
        d.pickup !== "Location not specified" ? d.pickup : ""
      );

      const calculatedDistances = await getBatchDrivingDistances(ngoAddress, destinationsList);
      
      const newDistancesMap: Record<string, string> = {};
      rawDonations.forEach((donation, index) => {
        newDistancesMap[donation.id] = destinationsList[index] 
          ? calculatedDistances[index] 
          : "Distance unknown";
      });

      setDistancesMap(newDistancesMap);
    }

    appendDistances();
  }, [isMapsReady, rawDonations, ngoAddress]);

  // Parse distance string "X km away" to a number for sorting
  function parseDistance(dist: string) {
    if (!dist || dist.includes("error") || dist.includes("unknown") || dist.includes("Calculating")) return Infinity;
    const match = dist.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : Infinity;
  }

  // Client-Side Computed Filtering Logic
  const filteredDonations = rawDonations.filter((donation) => {
    const matchesStatus = selectedStatus 
      ? donation.status.toLowerCase() === selectedStatus.toLowerCase() 
      : true;
    
    const matchesCategory = selectedCategory
      ? donation.title.toLowerCase().includes(selectedCategory.toLowerCase())
      : true;

    const cleanQuery = searchQuery.toLowerCase().trim();
    const actualDistance = distancesMap[donation.id] || "Calculating...";
    const dateStr = donation.collection_datetime 
      ? new Date(donation.collection_datetime).toLocaleString() 
      : "";

    const matchesSearch = 
      cleanQuery === "" ||
      donation.title.toLowerCase().includes(cleanQuery) ||
      donation.donor.toLowerCase().includes(cleanQuery) ||
      donation.pickup.toLowerCase().includes(cleanQuery) ||
      donation.status.toLowerCase().includes(cleanQuery) ||
      actualDistance.toLowerCase().includes(cleanQuery) ||
      dateStr.toLowerCase().includes(cleanQuery);

    return matchesStatus && matchesCategory && matchesSearch;
  }).sort((a, b) => {
    const activeSort = sortBy || "Nearest"; // Automatically sort by nearest if nothing is selected

    if (activeSort === "Nearest") {
      const distA = parseDistance(distancesMap[a.id]);
      const distB = parseDistance(distancesMap[b.id]);
      return distA - distB;
    }
    if (activeSort === "Deadline (Soonest)") {
      const dateA = a.collection_datetime ? new Date(a.collection_datetime).getTime() : Infinity;
      const dateB = b.collection_datetime ? new Date(b.collection_datetime).getTime() : Infinity;
      return dateA - dateB;
    }
    if (activeSort === "Recently Added") {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel={ngoName.substring(0, 2).toUpperCase()} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {ngoName}</h1>
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
          <div className="flex gap-2">
            <div className="relative">
              <button 
                type="button"
                onClick={() => { setShowSort(!showSort); setShowFilters(false); }}
                className={`rounded-md border px-4 py-2 text-sm transition-colors hover:bg-secondary ${showSort || sortBy ? "bg-secondary border-primary/40" : "bg-card"}`}
              >
                Sort {sortBy ? `(${sortBy})` : ""}
              </button>

              {showSort && (
                <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-md border bg-popover p-4 shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Sort By</label>
                  <div className="flex flex-col gap-1">
                    {["Nearest", "Deadline (Soonest)", "Recently Added"].map((sortOption) => (
                      <button
                        key={sortOption}
                        type="button"
                        onClick={() => setSortBy(sortBy === sortOption ? null : sortOption)}
                        className={`w-full rounded px-2 py-1.5 text-left text-xs font-medium transition-colors ${sortBy === sortOption ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
                      >
                        {sortOption}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                type="button"
                onClick={() => { setShowFilters(!showFilters); setShowSort(false); }}
                className={`rounded-md border px-4 py-2 text-sm transition-colors hover:bg-secondary ${showFilters || selectedStatus || selectedCategory ? "bg-secondary border-primary/40" : "bg-card"}`}
              >
                Filters {(selectedStatus || selectedCategory) ? "(Active)" : ""}
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-md border bg-popover p-4 shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
                  
                  {/* Status */}
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Status</label>
                  <div className="flex flex-col gap-1 mb-4">
                    {["Unclaimed", "Claimed"].map((statusOption) => (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={() => setSelectedStatus(selectedStatus === statusOption ? null : statusOption)}
                        className={`w-full rounded px-2 py-1.5 text-left text-xs font-medium transition-colors ${selectedStatus === statusOption ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>

                  {/* Category */}
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Category</label>
                  <div className="flex flex-col gap-1">
                    {["Produce", "Bakery", "Dairy", "Meat", "Prepared", "Beverages", "Snacks"].map((catOption) => (
                      <button
                        key={catOption}
                        type="button"
                        onClick={() => setSelectedCategory(selectedCategory === catOption ? null : catOption)}
                        className={`w-full rounded px-2 py-1.5 text-left text-xs font-medium transition-colors ${selectedCategory === catOption ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
                      >
                        {catOption}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="mt-8 mb-3 text-sm font-semibold">
          Available Donations Near You ({filteredDonations.length})
        </h2>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading available donations...</div>
        ) : filteredDonations.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            {searchQuery || selectedStatus || selectedCategory
              ? "No donations matching your filters found."
              : "No available donations right now."}
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
                  <h3 className="font-semibold capitalize">{d.title}</h3>
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
                    <dd className="font-semibold text-foreground">
                      {distancesMap[d.id] || "Calculating..."}
                    </dd>
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