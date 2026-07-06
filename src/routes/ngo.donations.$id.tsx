import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { supabase } from "@/lib/supabase"; 

import imgBeverages from "@/assets/images/beverages.jpeg";
import imgCannedGoods from "@/assets/images/canned-goods.jpeg";
import imgDairy from "@/assets/images/dairy.jpeg";
import imgMeat from "@/assets/images/meat.jpeg";
import imgMixed from "@/assets/images/mixed-donation.jpg";
import imgPreparedGoods from "@/assets/images/prepared-goods.jpeg";
import imgSnacks from "@/assets/images/snacks.jpeg";

function getImageForCategory(type: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("beverage") || t.includes("drink")) return imgBeverages;
  if (t.includes("can")) return imgCannedGoods;
  if (t.includes("dairy") || t.includes("milk") || t.includes("cheese")) return imgDairy;
  if (t.includes("meat") || t.includes("poultry") || t.includes("fish")) return imgMeat;
  if (t.includes("prepared") || t.includes("meal")) return imgPreparedGoods;
  if (t.includes("snack") || t.includes("chip") || t.includes("candy")) return imgSnacks;
  return imgMixed; // Fallback
} 

export const Route = createFileRoute("/ngo/donations/$id")({
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
}

function useGoogleMaps() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ((window as any).google?.maps?.places) {
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
        if ((window as any).google?.maps?.places) setReady(true);
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {};
  }, []);

  return ready;
}

export function getRealDrivingDistance(
  origin: string, 
  destination: string
): Promise<string> {
  return new Promise((resolve) => {
    if (!(window as any).google?.maps || !origin || !destination) {
      resolve("Distance unavailable");
      return;
    }

    const service = new (window as any).google.maps.DistanceMatrixService();
    
    try {
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: (window as any).google.maps.TravelMode.DRIVING,
          unitSystem: (window as any).google.maps.UnitSystem.METRIC, 
        },
        (response: any, status: string) => {
          if (status === "OK" && response.rows[0]?.elements[0]?.status === "OK") {
            const distanceText = response.rows[0].elements[0].distance.text; 
            resolve(`${distanceText} away`);
          } else {
            const elementStatus = response?.rows[0]?.elements[0]?.status;
            console.error("Distance Matrix failed:", status, elementStatus);
            resolve(`Unavailable (${elementStatus || status})`);
          }
        }
      );
    } catch (e) {
      console.error("Distance calculation error:", e);
      resolve("Calculation error");
    }
  });
}

function DonationDetail() {
  const { id } = Route.useParams();
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

        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (user) {
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
          const rawBatch = data as any;
          const donorInfo = Array.isArray(rawBatch.donors) 
            ? rawBatch.donors[0] 
            : rawBatch.donors;

          // Compute exact aggregate breakdown details matching explore list format logic
          const itemQuantities = (rawBatch.donation_items ?? [])
            .map((item: any) => {
              const quantity = Number(item.quantity);
              const unit = item.unit ? String(item.unit).trim() : "items";
              return Number.isFinite(quantity) && quantity > 0 ? `${quantity} ${unit}` : null;
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
            batch_type: rawBatch.batch_type || "Surplus Food"
          });

          // Compute distinct structure categories from related dataset fields safely
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
          <AppHeader nav={ngoNav} userLabel={ngoName.substring(0, 2).toUpperCase()} />
          <main className="mx-auto max-w-3xl px-6 py-10">
            <Link to="/ngo/explore" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Available Donations
            </Link>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="aspect-square rounded-xl border bg-secondary overflow-hidden">
                <img 
                  src={getImageForCategory(batch?.batch_type || "")} 
                  alt={batch?.batch_type || "Donation"} 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold capitalize">{batch?.batch_type}</h1>
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
                This donation includes {batch?.batch_type} 
                {itemCategories.length > 0 && ` (${itemCategories.join(", ")})`}. 
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