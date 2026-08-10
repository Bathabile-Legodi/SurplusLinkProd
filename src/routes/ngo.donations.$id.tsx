import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { useAuth } from "@/hooks/useAuth";

import imgBeverages from "@/assets/images/beverages.jpeg";
import imgCannedGoods from "@/assets/images/canned-goods.jpeg";
import imgDairy from "@/assets/images/dairy.jpeg";
import imgMeat from "@/assets/images/meat.jpeg";
import imgMixed from "@/assets/images/mixed-donation.jpg";
import imgPreparedGoods from "@/assets/images/prepared-goods.jpeg";
import imgSnacks from "@/assets/images/snacks.jpeg";
import imgBakery from "@/assets/images/bakery.png";

function getImageForCategory(typeOrCategories: string | string[]) {
  const types = Array.isArray(typeOrCategories) ? typeOrCategories : [typeOrCategories];
  const combined = types.join(" ").toLowerCase();
  
  if (combined.includes("beverage") || combined.includes("drink")) return imgBeverages;
  if (combined.includes("can")) return imgCannedGoods;
  if (combined.includes("dairy") || combined.includes("milk") || combined.includes("cheese")) return imgDairy;
  if (combined.includes("meat") || combined.includes("poultry") || combined.includes("fish")) return imgMeat;
  if (combined.includes("prepared") || combined.includes("meal")) return imgPreparedGoods;
  if (combined.includes("snack") || combined.includes("chip") || combined.includes("candy")) return imgSnacks;
  if (combined.includes("bakery") || combined.includes("bread") || combined.includes("pastry")) return imgBakery;
  return imgMixed; // Fallback
} 

export const Route = createFileRoute("/ngo/donations/$id")({
  beforeLoad: () => requireRole("ngo"),
  head: () => ({ meta: [{ title: "Donation Details — SurplusLink" }] }),
  component: DonationDetail,
});

interface DonationDetailState {
  id: string;
  quantity: string;
  collection_datetime: string; 
  donor: string;
  pickup: string;             
  batch_type: string;
  status: string;
}

function useGoogleMaps() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const globalWin = window as any;
    if (globalWin.google?.maps?.routes) {
      setReady(true);
      return;
    }

    if (!globalWin._mapsReadyCallbacks) {
      globalWin._mapsReadyCallbacks = [];
    }

    globalWin._mapsReadyCallbacks.push(() => setReady(true));

    globalWin.initGoogleMaps = () => {
      if (globalWin._mapsReadyCallbacks) {
        globalWin._mapsReadyCallbacks.forEach((cb: () => void) => cb());
      }
    };

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => {
        if (globalWin.google?.maps?.routes) setReady(true);
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=routes&callback=initGoogleMaps&loading=async`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {};
  }, []);

  return ready;
}

export async function getRealDrivingDistance(
  origin: string, 
  destination: string
): Promise<string> {
  const globalWin = window as any;
  if (!globalWin.google?.maps || !origin || !destination) {
    return "Distance unavailable";
  }

  // Primary calculation attempt via modern RouteMatrix API with safety timeout
  try {
    if (globalWin.google.maps.routes?.RouteMatrix) {
      const request = {
        origins: [origin],
        destinations: [destination],
        travelMode: "DRIVING",
        fields: ["distanceMeters", "condition"], 
      };

      const modernCall = globalWin.google.maps.routes.RouteMatrix.computeRouteMatrix(request);
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("RouteMatrix stream timeout")), 3000)
      );

      const response: any = await Promise.race([modernCall, timeout]);
      const element = response?.matrix?.rows?.[0]?.items?.[0] || response?.[0]?.elements?.[0] || (Array.isArray(response) ? response[0] : null);

      if (element && (element.condition === "ROUTE_EXISTS" || !element.status)) {
        const meters = element.distanceMeters;
        if (typeof meters === "number" && !isNaN(meters)) {
          if (meters === 0) return "Same location";
          if (meters < 100) return "< 0.1 km away";
          const km = (meters / 1000).toFixed(1);
          return `${km} km away`;
        }
      }
    }
  } catch (e) {
    console.warn("Modern Route Matrix execution timed out or failed. Attempting fallback to DistanceMatrixService...", e);
  }

  // Fallback to legacy DistanceMatrixService
  return new Promise((resolve) => {
    try {
      const service = new globalWin.google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: globalWin.google.maps.TravelMode.DRIVING,
        },
        (response: any, status: string) => {
          if (status === "OK" && response?.rows?.[0]?.elements?.[0]?.status === "OK") {
            const element = response.rows[0].elements[0];
            resolve(element.distance.text);
          } else {
            resolve("Distance unknown");
          }
        }
      );
    } catch (fallbackErr) {
      console.error("Distance Matrix fallback failed:", fallbackErr);
      resolve("Distance unavailable");
    }
  });
}

function DonationDetail() {
  const { id } = Route.useParams();
  const { initials } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMapsReady = useGoogleMaps(); 

  const [batch, setBatch] = useState<DonationDetailState | null>(null);
  const [ngoAddress, setNgoAddress] = useState<string>("");
  const [ngoName, setNgoName] = useState<string>("NGO");
  const [loading, setLoading] = useState<boolean>(true);
  const [distance, setDistance] = useState<string>("Calculating distance...");
  const [itemCategories, setItemCategories] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchBatchDetailAndProfile() {
      try {
        setLoading(true);

        // 1. Verify session before auth call
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          if (isMounted) console.warn("No active auth session detected or session expired.");
        } else {
          // 2. Safely retrieve user data
          const { data: { user }, error: userError } = await supabase.auth.getUser();

          if (userError) {
            console.error("Failed to fetch user:", userError.message);
          } else if (user && isMounted) {
            const { data: ngoProfile } = await supabase
              .from("ngos")
              .select("organization_name, address")
              .eq("id", user.id)
              .single();

            if (ngoProfile && isMounted) {
              setNgoAddress(ngoProfile.address || "");
              setNgoName(ngoProfile.organization_name || "Hope Shelter");
            }
          }
        }

        const { data, error } = await supabase
          .from("donation_batches")
          .select(`
            id,
            batch_type,
            collection_datetime,
            status,
            donors!donor_id (
              organization_name,
              address
            ),
            donation_items (
              quantity,
              unit,
              category
            )
          `)
          .eq("id", id)
          .single();
        
        if (error) throw error;

        if (data && isMounted) {
          let rawBatch = data as any;

          // REAL-TIME EXPIRY CONTROL WITH RLS FALLBACK
          if (rawBatch.collection_datetime && rawBatch.status?.toLowerCase() !== "expired") {
            const expiryTime = new Date(rawBatch.collection_datetime).getTime();
            const now = Date.now();

            if (now > expiryTime) {
              // 1. Force state locally first so UI behaves correctly regardless of DB permissions
              rawBatch.status = "Expired";

              // 2. Safely attempt database sync
              try {
                const { error: updateError } = await supabase
                  .from("donation_batches")
                  .update({ status: "Expired" })
                  .eq("id", id);

                if (updateError) {
                  // Handled gracefully: RLS restriction warning in the background
                  console.warn(
                    "Note: Status updated locally to Expired. Database update bypassed due to RLS write restrictions:",
                    updateError.message
                  );
                }
              } catch (writeErr) {
                console.warn("Could not sync expired status to remote database:", writeErr);
              }
            }
          }

          const donorInfo = Array.isArray(rawBatch.donors) 
            ? rawBatch.donors[0] 
            : rawBatch.donors;

           const itemQuantities = (rawBatch.donation_items ?? [])
              .map((item: any) => {
                if (item.quantity === null || item.quantity === undefined) return null;
                const quantity = String(item.quantity).trim();
                const unit = item.unit ? String(item.unit).trim() : "items";

                if (!quantity) return null;

                return unit ? `${quantity} ${unit}` : quantity;
              })
              .filter(Boolean) as string[];

          const formattedQuantityText = itemQuantities.length > 0
            ? itemQuantities.join(" • ")
            : "1 Batch";

          setBatch({
            id: rawBatch.id,
            quantity: formattedQuantityText, 
            collection_datetime: rawBatch.collection_datetime ? new Date(rawBatch.collection_datetime).toLocaleString() : "N/A",
            donor: donorInfo?.organization_name || "Anonymous Donor",
            pickup: donorInfo?.address || "Location not specified", 
            batch_type: rawBatch.batch_type || "Surplus Food",
            status: rawBatch.status || "Unclaimed"
          });

          const extracted: string[] = (rawBatch.donation_items ?? []).flatMap((item: { category?: string | null }) =>
            item.category ? item.category.split(", ").map((c: string) => c.trim()) : []
          );
          setItemCategories(Array.from(new Set(extracted)).filter((category): category is string => Boolean(category)));
        }

      } catch (err) {
        if (isMounted) console.error("Error fetching donation details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchBatchDetailAndProfile();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    const pickupLocation = batch?.pickup;
    if (!isMapsReady || !pickupLocation || !ngoAddress || pickupLocation === "Location not specified") {
      if (pickupLocation === "Location not specified") setDistance("Distance unknown");
      return;
    }

    async function computeDistance() {
      const realDistance = await getRealDrivingDistance(ngoAddress || "", pickupLocation || "");
      setDistance(realDistance);
    }

    computeDistance();
  }, [isMapsReady, batch?.pickup, ngoAddress]);

  const isChildRoute = location.pathname !== `/ngo/donations/${id}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader nav={ngoNav} userLabel={initials} />
        <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted-foreground">
          Loading donation details...
        </main>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader nav={ngoNav} userLabel={initials} />
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
          <AppHeader nav={ngoNav} userLabel={initials} />
          <main className="mx-auto max-w-3xl px-6 py-10">
            <Link to="/ngo/explore" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Available Donations
            </Link>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="aspect-square rounded-xl border bg-secondary overflow-hidden">
                <img 
                  src={getImageForCategory([batch?.batch_type || "", ...itemCategories])} 
                  alt={batch?.batch_type || "Donation"} 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h1 className="text-xl font-semibold capitalize">{batch?.batch_type}</h1>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0
                    ${batch.status.toLowerCase() === "unclaimed" ? "bg-emerald-500/10 text-emerald-600" : ""}
                    ${batch.status.toLowerCase() === "claimed" ? "bg-blue-500/10 text-blue-600" : ""}
                    ${batch.status.toLowerCase() === "expired" ? "bg-destructive/10 text-destructive" : ""}
                  `}>
                    {batch.status}
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label="Quantity" value={batch?.quantity} />
                  <Row label="Expiry Time" value={batch?.collection_datetime || "N/A"} />
                  <Row label="Donor" value={batch?.donor || "Anonymous Donor"} />
                  <Row label="Distance" value={distance} />
                  <Row 
                    label="Location" 
                    value={batch?.pickup || "Location not specified"} 
                    highlight 
                    href={
                      batch?.pickup && batch.pickup !== "Location not specified"
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(batch.pickup)}`
                        : undefined
                    }
                  />
                </dl>
              </div>
            </div>

            <section className="mt-8 rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold">About This Donation</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                This donation includes {itemCategories.length > 0 ? itemCategories.join(", ") : batch?.batch_type}. 
                Donation must be collected before {batch?.collection_datetime} - quality checked and ready for distribution.
              </p>
              {itemCategories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {itemCategories.map((cat) => (
                    <span key={cat} className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <button
              type="button"
              disabled={batch.status.toLowerCase() === "expired"}
              onClick={() => navigate({ to: `/ngo/donations/${id}/claim` })}
              className={`mt-6 w-full rounded-md py-3 text-sm font-medium transition-colors ${
                batch.status.toLowerCase() === "expired" 
                  ? "bg-muted text-muted-foreground cursor-not-allowed" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {batch.status.toLowerCase() === "expired" ? "Donation Expired" : "Claim Donation"}
            </button>
          </main>
        </div>
      )}
      <Outlet />
    </>
  );
}

function Row({ 
  label, 
  value, 
  highlight, 
  href 
}: { 
  label: string; 
  value: string; 
  highlight?: boolean; 
  href?: string; 
}) {
  return (
    <div className="flex justify-between border-b py-1.5 gap-4">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className={highlight ? "rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 font-semibold text-blue-900 truncate max-w-[70%]" : "font-medium text-right truncate max-w-[70%]"}>
        {href ? (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:underline hover:text-blue-700 block truncate text-left"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}