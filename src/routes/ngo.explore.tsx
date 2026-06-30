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
  const [selectedStatus, setSelectedStatus] = useState<string>("Unclaimed");
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
              status: batch.status || "Unclaimed"
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

  // Client-Side Computed Filtering Logic
  const filteredDonations = rawDonations.filter((donation) => {
    const matchesStatus = donation.status.toLowerCase() === selectedStatus.toLowerCase();
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
          <button 
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-md border px-4 py-2 text-sm transition-colors hover:bg-secondary ${showFilters ? "bg-secondary border-primary/40" : "bg-card"}`}
          >
            Filters
          </button>

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
                      setShowFilters(false); 
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