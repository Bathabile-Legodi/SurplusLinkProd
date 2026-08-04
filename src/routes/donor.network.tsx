import { createFileRoute } from "@tanstack/react-router";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { useEffect, useMemo, useState } from "react";
import { MapPin, ChevronRight, X, HeartHandshake, Loader2 } from "lucide-react";
import CommunityMap from "@/components/CommunityMap";

// TODO: confirm this matches the client export used in CommunityMap.tsx
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/donor/network")({
  head: () => ({
    meta: [{ title: "Community Network — Developing digital projects" }],
  }),
  component: DonorNetwork,
});

// ---- Types matching live data ------------------------------------------

type NetworkRow = {
  donor_id: string;
  donor_name: string;
  ngo_id: string;
  ngo_name: string;
  ngo_latitude: number | null;
  ngo_longitude: number | null;
  ngo_address: string | null;
};

type ItemAgg = {
  category: string;
  totalQuantity: number;
  unit: string | null;
  itemCount: number;
};

type NGO = {
  id: string;
  name: string;
  address: string | null;
  distanceKm: number | null;
  needs: string[]; // top categories claimed by this NGO from this donor
  impactStory: string;
  impactMetric: string;
};

// ---- Helpers -------------------------------------------------------------

// Haversine distance in km
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Tries a few common shapes for lat/lng stored in a Google Places-style jsonb blob.
// ADJUST THIS if it doesn't match your actual address_components shape.
function extractLatLng(addressComponents: unknown): { lat: number; lng: number } | null {
  if (!addressComponents || typeof addressComponents !== "object") return null;
  const obj = addressComponents as Record<string, any>;

  const candidates = [
    obj?.geometry?.location, // { lat, lng }
    obj?.location, // { lat, lng }
    obj, // { lat, lng } directly on the object
    obj?.latitude != null && obj?.longitude != null
      ? { lat: obj.latitude, lng: obj.longitude }
      : null,
  ];

  for (const c of candidates) {
    if (c && typeof c.lat === "number" && typeof c.lng === "number") {
      return { lat: c.lat, lng: c.lng };
    }
  }

  console.warn(
    "[DonorNetwork] Could not find lat/lng in donors.address_components. " +
      "Distances will be unavailable. Actual shape:",
    addressComponents
  );
  return null;
}

function buildNeedsAndImpact(items: ItemAgg[]): {
  needs: string[];
  impactStory: string;
  impactMetric: string;
} {
  if (items.length === 0) {
    return {
      needs: [],
      impactStory: "No completed donations from you have reached this partner yet.",
      impactMetric: "0 items delivered",
    };
  }

  const sorted = [...items].sort((a, b) => b.totalQuantity - a.totalQuantity);
  const needs = sorted.slice(0, 3).map((i) => i.category);

  const totalItemCount = items.reduce((sum, i) => sum + i.itemCount, 0);
  const topCategory = sorted[0];

  const impactStory =
    `Your donations of ${needs.join(", ").toLowerCase()} have been claimed by this partner, ` +
    `with ${topCategory.category.toLowerCase()} making up the largest share ` +
    `(${topCategory.totalQuantity}${topCategory.unit ? " " + topCategory.unit : ""}).`;

  const impactMetric = `${totalItemCount} item${totalItemCount === 1 ? "" : "s"} delivered`;

  return { needs, impactStory, impactMetric };
}

// ---- Component -------------------------------------------------------------

function DonorNetwork() {
  const [selectedNgo, setSelectedNgo] = useState<NGO | null>(null);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: replace with the real authenticated donor id
  const loggedInDonorId = "PASTE_A_TEST_UUID_HERE";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1. Partner directory: NGOs this donor has an established link with
        const { data: networkRows, error: networkErr } = await supabase
          .from("donor_community_network")
          .select("*")
          .eq("donor_id", loggedInDonorId);

        if (networkErr) throw networkErr;

        // 2. Donor's own coordinates, for distance calculation
        const { data: donorRow, error: donorErr } = await supabase
          .from("donors")
          .select("address_components")
          .eq("id", loggedInDonorId)
          .maybeSingle();

        if (donorErr) throw donorErr;
        const donorCoords = extractLatLng(donorRow?.address_components);

        // 3. Delivered donation items, joined via donation_batches, to compute
        //    needs + impact per NGO. Only "Delivered" counts as real impact —
        //    "Claimed" just means an NGO has dibs but goods haven't arrived yet.
        const { data: batches, error: batchesErr } = await supabase
          .from("donation_batches")
          .select("claimed_by, donation_items(category, quantity, unit)")
          .eq("donor_id", loggedInDonorId)
          .eq("status", "Delivered");

        if (batchesErr) throw batchesErr;

        // Aggregate items per ngo_id -> per category
        const aggByNgo = new Map<string, Map<string, ItemAgg>>();
        for (const batch of batches ?? []) {
          const ngoId = batch.claimed_by as string;
          const items = (batch as any).donation_items as
            | { category: string; quantity: number; unit: string | null }[]
            | null;
          if (!items) continue;

          if (!aggByNgo.has(ngoId)) aggByNgo.set(ngoId, new Map());
          const catMap = aggByNgo.get(ngoId)!;

          for (const item of items) {
            const key = item.category ?? "Uncategorized";
            const existing = catMap.get(key);
            if (existing) {
              existing.totalQuantity += Number(item.quantity) || 0;
              existing.itemCount += 1;
            } else {
              catMap.set(key, {
                category: key,
                totalQuantity: Number(item.quantity) || 0,
                unit: item.unit ?? null,
                itemCount: 1,
              });
            }
          }
        }

        const built: NGO[] = (networkRows as NetworkRow[]).map((row) => {
          const catMap = aggByNgo.get(row.ngo_id);
          const itemAggs = catMap ? Array.from(catMap.values()) : [];
          const { needs, impactStory, impactMetric } = buildNeedsAndImpact(itemAggs);

          const dist =
            donorCoords && row.ngo_latitude != null && row.ngo_longitude != null
              ? distanceKm(
                  donorCoords.lat,
                  donorCoords.lng,
                  row.ngo_latitude,
                  row.ngo_longitude
                )
              : null;

          return {
            id: row.ngo_id,
            name: row.ngo_name,
            address: row.ngo_address,
            distanceKm: dist,
            needs,
            impactStory,
            impactMetric,
          };
        });

        // Nearest first; unknown distances sink to the bottom
        built.sort((a, b) => {
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });

        if (!cancelled) setNgos(built);
      } catch (e: any) {
        console.error("[DonorNetwork] Failed to load live network data:", e);
        if (!cancelled) setError(e?.message ?? "Failed to load community network.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [loggedInDonorId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader nav={donorNav} userLabel="FM" />
      <main className="mx-auto flex-1 w-full max-w-7xl px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Community Network</h1>
          <p className="mt-2 text-muted-foreground">
            See exactly where your surplus goes and the lives it touches in real-time.
          </p>
        </div>

        <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border bg-card shadow-sm lg:flex-row">
          {/* LIVE MAP INTERFACE */}
          <div className="relative flex-1 bg-muted/30 overflow-hidden flex items-center justify-center p-2">
            <div className="w-full h-full overflow-hidden rounded-lg bg-white">
              <CommunityMap loggedInDonorId={loggedInDonorId} />
            </div>
          </div>

          {/* Directory / Detail Panel Container */}
          <div className="relative w-full border-l bg-card lg:w-[400px] overflow-hidden">
            {/* NGO Directory List */}
            <div
              className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out ${
                selectedNgo ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100"
              }`}
            >
              <div className="border-b p-5 bg-muted/20">
                <h2 className="font-semibold">Local Partner Directory</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a partner to view impact details.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y">
                {loading && (
                  <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading partners…
                  </div>
                )}

                {!loading && error && (
                  <div className="p-5 text-sm text-destructive">{error}</div>
                )}

                {!loading && !error && ngos.length === 0 && (
                  <div className="p-5 text-sm text-muted-foreground">
                    No partners linked to your donations yet.
                  </div>
                )}

                {!loading &&
                  !error &&
                  ngos.map((ngo) => (
                    <button
                      key={ngo.id}
                      onClick={() => setSelectedNgo(ngo)}
                      className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-muted/50 group"
                    >
                      <div>
                        <div className="font-medium group-hover:text-primary transition-colors">
                          {ngo.name}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {ngo.distanceKm != null
                            ? `${ngo.distanceKm.toFixed(1)} km away`
                            : "Distance unavailable"}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Detail Panel */}
            <div
              className={`absolute inset-0 flex flex-col bg-card transition-transform duration-300 ease-in-out shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] ${
                selectedNgo ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
              }`}
            >
              {selectedNgo && (
                <>
                  <div className="border-b p-4 flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur z-10">
                    <button
                      onClick={() => setSelectedNgo(null)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                      Back to list
                    </button>
                    <button
                      onClick={() => setSelectedNgo(null)}
                      className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold tracking-tight">{selectedNgo.name}</h2>
                      <p className="text-sm text-muted-foreground flex items-center mt-2">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {selectedNgo.distanceKm != null
                          ? `${selectedNgo.distanceKm.toFixed(1)} km from loading dock`
                          : selectedNgo.address ?? "Address unavailable"}
                      </p>
                    </div>

                    <div className="mb-8 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-5 border border-emerald-100/50 dark:border-emerald-900/50 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <HeartHandshake className="h-24 w-24 text-emerald-600" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-400 mb-3">
                          <HeartHandshake className="h-5 w-5" />
                          Impact Story
                        </div>
                        <p className="text-sm text-emerald-800/90 dark:text-emerald-300/90 italic leading-relaxed">
                          "{selectedNgo.impactStory}"
                        </p>
                        <div className="mt-4 inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-sm">
                          {selectedNgo.impactMetric}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold mb-3">Primary Needs</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedNgo.needs.length === 0 && (
                          <span className="text-xs text-muted-foreground">
                            No claimed categories yet.
                          </span>
                        )}
                        {selectedNgo.needs.map((need) => (
                          <span
                            key={need}
                            className="inline-flex items-center rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground border"
                          >
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t bg-muted/10">
                    <button className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow">
                      Direct Donation
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}