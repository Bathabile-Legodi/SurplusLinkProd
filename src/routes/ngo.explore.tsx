import { useEffect, useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, Filter, ArrowUpDown, Clock, MapPin, Package, Heart } from "lucide-react";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const getAvailableDonations = createServerFn({ method: "GET" }).handler(async () => {
  const supabaseServer = createSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: ngoProfile } = await supabaseServer
    .from("ngos")
    .select("id, organization_name, address")
    .eq("id", user.id)
    .single();

  const { data, error } = await supabaseServer
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
      donation_items (
        quantity,
        unit
      )
    `)
    .or("status.eq.unclaimed,status.eq.Unclaimed") 
    .limit(25);

  if (error) throw error;

  const formattedData: DonationUI[] = (data || []).map((batch: any) => {
    const donorInfo = Array.isArray(batch.donors) ? batch.donors[0] : batch.donors;
    const donorAddress = donorInfo?.address || "";
    const donorName = donorInfo?.organization_name || "Anonymous Donor";

    const itemQuantities = (batch.donation_items ?? [])
      .map((item: any) => {
        if (item.quantity === null || item.quantity === undefined) return null;
        const quantity = String(item.quantity).trim();
        const unit = item.unit ? String(item.unit).trim() : "items";
        if (!quantity) return null;
        return unit ? `${quantity} ${unit}` : quantity;
      })
      .filter(Boolean) as string[];

    const quantityText = itemQuantities.length > 0 ? itemQuantities.join(" • ") : "1 Batch";

    return {
      id: batch.id,
      title: batch.batch_type || "General Batch",
      quantity: quantityText,
      pickup: donorAddress || "Location not specified",
      donor: donorName,
      distance: "Calculating...",
      status: batch.status || "Unclaimed",
      created_at: batch.created_at,
      collection_datetime: batch.collection_datetime
    };
  });

  return {
    ngoAddress: ngoProfile?.address || "",
    ngoName: ngoProfile?.organization_name || "Hope Shelter",
    donations: formattedData
  };
});

export const exploreQueryOptions = queryOptions({
  queryKey: ["donations", "available"],
  queryFn: () => getAvailableDonations(),
});

export const Route = createFileRoute("/ngo/explore")({
  beforeLoad: () => requireRole("ngo"),
  loader: ({ context }) => context.queryClient.ensureQueryData(exploreQueryOptions),
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

function useGoogleMaps() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ((window as any).google?.maps?.routes) {
      setReady(true);
      return;
    }

    if (!(window as any)._mapsReadyCallbacks) {
      (window as any)._mapsReadyCallbacks = [];
    }

    (window as any)._mapsReadyCallbacks.push(() => setReady(true));

    (window as any).initGoogleMaps = () => {
      if ((window as any)._mapsReadyCallbacks) {
        (window as any)._mapsReadyCallbacks.forEach((cb: () => void) => cb());
      }
    };

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => {
        if ((window as any).google?.maps?.routes) setReady(true);
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&callback=initGoogleMaps&loading=async&libraries=routes`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {};
  }, []);

  return ready;
}

export async function getBatchDrivingDistances(
  origin: string,
  destinations: string[]
): Promise<string[]> {
  const globalWin = window as any;
  if (!globalWin.google?.maps?.routes || !origin || destinations.length === 0) {
    return destinations.map(() => "Distance unavailable");
  }

  const validDestinations = destinations.map(d => d.trim() === "" ? "Unknown Location" : d);

  try {
    const request = {
      origins: [origin],
      destinations: validDestinations,
      travelMode: "DRIVING",
      fields: ["distanceMeters", "condition"],
    };

    const response = await globalWin.google.maps.routes.RouteMatrix.computeRouteMatrix(request);
    
    let matrixItems: any[] = [];
    if (Array.isArray(response)) {
      matrixItems = response;
    } else if (Array.isArray(response?.matrix?.rows?.[0]?.items)) {
      matrixItems = response.matrix.rows[0].items;
    } else if (Array.isArray(response?.[0]?.elements)) {
      matrixItems = response[0].elements;
    }

    if (matrixItems.length > 0) {
      return matrixItems.map((element: any) => {
        if (element && (element.condition === "ROUTE_EXISTS" || !element.status)) {
          const meters = element.distanceMeters;
          if (typeof meters === "number" && !isNaN(meters)) {
            if (meters === 0) return "Same location";
            if (meters < 100) return "< 0.1 km away";
            const km = (meters / 1000).toFixed(1);
            return `${km} km away`;
          }
        }
        return "Distance unknown";
      });
    }

    console.error("Route Matrix execution did not produce an array structure inside output container:", response);
    return destinations.map(() => "Distance error");
  } catch (e) {
    console.error("Failed executing modern route matrix operation:", e);
    return destinations.map(() => "Distance error");
  }
}

function ExplorePage() {
  const { initials } = useAuth();
  const isMapsReady = useGoogleMaps();
  
  const { data: queryData } = useSuspenseQuery(exploreQueryOptions);
  const rawDonations = queryData.donations;
  const ngoAddress = queryData.ngoAddress;
  const ngoName = queryData.ngoName;

  const [distancesMap, setDistancesMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSort, setShowSort] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [showExpired, setShowExpired] = useState(false);

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

  function parseDistance(dist: string) {
    if (!dist || dist.includes("error") || dist.includes("unknown") || dist.includes("Calculating")) return Infinity;
    const match = dist.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : Infinity;
  }

  const now = new Date();

  const filteredDonations = rawDonations.filter((donation) => {
    const matchesCategory = selectedCategory
      ? donation.title.toLowerCase().includes(selectedCategory.toLowerCase())
      : true;

    const cleanQuery = searchQuery.toLowerCase().trim();
    const matchesSearch =
      cleanQuery === "" ||
      donation.title.toLowerCase().includes(cleanQuery) ||
      donation.donor.toLowerCase().includes(cleanQuery) ||
      donation.pickup.toLowerCase().includes(cleanQuery);

    // A batch is "expired" if its collection deadline has passed
    const isExpired = donation.collection_datetime
      ? new Date(donation.collection_datetime) < now
      : false;

    const matchesExpiry = showExpired ? true : !isExpired;

    return matchesCategory && matchesSearch && matchesExpiry;
  });

  const sortedDonations = [...filteredDonations].sort((a, b) => {
    if (!sortBy || sortBy === "Nearest") {
      const distA = parseDistance(distancesMap[a.id] || "");
      const distB = parseDistance(distancesMap[b.id] || "");
      return distA - distB;
    }

    if (sortBy === "Deadline (Soonest)") {
      const dateA = a.collection_datetime ? new Date(a.collection_datetime).getTime() : Infinity;
      const dateB = b.collection_datetime ? new Date(b.collection_datetime).getTime() : Infinity;
      return dateA - dateB;
    }

    if (sortBy === "Recently Added") {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }

    return 0;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader nav={ngoNav} userLabel={initials} />
      <main className="mx-auto flex-1 w-full max-w-7xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {ngoName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's surplus food from verified donors near you.
        </p>

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
                onClick={() => {
                  setShowSort(!showSort);
                  setShowFilters(false);
                }}
                className={`rounded-md border px-4 py-2 text-sm transition-colors hover:bg-secondary ${showSort || sortBy ? "bg-secondary border-primary/40" : "bg-card"}`}
              >
                Sort {sortBy ? `(${sortBy})` : ""}
              </button>

              {showSort && (
                <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-md border bg-popover p-4 shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sort By</label>
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
                onClick={() => {
                  setShowFilters(!showFilters);
                  setShowSort(false);
                }}
                className={`rounded-md border px-4 py-2 text-sm transition-colors hover:bg-secondary ${showFilters || selectedCategory || showExpired ? "bg-secondary border-primary/40" : "bg-card"}`}
              >
                Filters {selectedCategory || showExpired ? "(Active)" : ""}
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-md border bg-popover p-4 shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                  <div className="flex flex-col gap-1">
                    {['Produce', 'Bakery', 'Dairy', 'Meat', 'Prepared', 'Beverages', 'Snacks'].map((catOption) => (
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
                  <div className="mt-3 border-t pt-3">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Availability</label>
                    <button
                      type="button"
                      onClick={() => setShowExpired(v => !v)}
                      className={`w-full rounded px-2 py-1.5 text-left text-xs font-medium transition-colors ${showExpired ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
                    >
                      {showExpired ? "✓ " : ""}Show expired listings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="mt-8 mb-3 text-sm font-semibold">
          {showExpired ? "All Donations" : "Active Donations Near You"} ({sortedDonations.length})
        </h2>

        {sortedDonations.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            {searchQuery || selectedCategory
              ? "No donations matching your filters found."
              : showExpired
              ? "No donations found."
              : "No active donations right now. Enable \"Show expired\" in Filters to see past listings."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedDonations.map((d) => (
              <Link
                key={d.id}
                to="/ngo/donations/$id"
                params={{ id: d.id }}
                className="rounded-xl border bg-card p-5 transition hover:shadow-sm block"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold capitalize text-foreground">{d.title}</h3>
                  {(() => {
                    const isExpired = d.collection_datetime
                      ? new Date(d.collection_datetime) < now
                      : false;
                    return isExpired ? (
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-500 border border-neutral-200 capitalize">
                        Expired
                      </span>
                    ) : (
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-600 capitalize">
                        {d.status}
                      </span>
                    );
                  })()}
                </div>
                
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Quantity</span>
                    <span className="text-foreground font-medium">{d.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span>Pickup at</span>
                    <span className="rounded-md border border-blue-100 bg-blue-50/50 px-2 py-0.5 font-semibold text-blue-900 max-w-[70%] truncate block">
                      {d.pickup}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Donor</span>
                    <span className="text-foreground font-medium">{d.donor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance</span>
                    <span className="font-semibold text-foreground">
                      {distancesMap[d.id] || "Calculating..."}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}