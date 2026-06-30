import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { supabase } from "@/lib/supabase"; 

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

// 1. Google Maps Script Injection Management Hook
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

// 2. Real-world distance background query calculation promise
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

  useEffect(() => {
    async function fetchBatchDetailAndProfile() {
      try {
        setLoading(true);

        // A. Fetch current NGO details (Fixed to use organization_name with a 'z')
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: ngoProfile } = await supabase
            .from("ngos")
            .select("organization_name, address")
            .eq("id", user.id)
            .single();

          if (ngoProfile) {
            setNgoAddress(ngoProfile.address || "");
            setNgoName(ngoProfile.organization_name || "Hope Shelter");
          }
        }

        // B. Fetch detailed distribution parameters for the target batch
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
          const rawBatch = data as any;
          const donorInfo = Array.isArray(rawBatch.donors) 
            ? rawBatch.donors[0] 
            : rawBatch.donors;

          setBatch({
            id: rawBatch.id,
            quantity: "1 Batch", 
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

    fetchBatchDetailAndProfile();
  }, [id]);

  // Handle real driving distance query execution after dependency addresses stabilize in state
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
              <div className="aspect-square rounded-xl border bg-secondary flex items-center justify-center text-xs text-muted-foreground uppercase font-semibold tracking-wider p-4 text-center">
                {batch?.batch_type}
              </div>
              <div>
                <h1 className="text-xl font-semibold capitalize">{batch?.batch_type}</h1>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label="Quantity" value={batch?.quantity || "1 Batch"} />
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
                This donation includes {batch?.batch_type}. Donation must be collected before {batch?.collection_datetime} - quality checked and ready for distribution.
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
            className="hover:underline hover:text-blue-700 block truncate"
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