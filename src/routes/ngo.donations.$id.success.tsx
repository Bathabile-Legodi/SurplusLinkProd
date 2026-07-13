import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { updateDonationStatus } from "@/lib/donations";
import { supabase } from "@/lib/supabase";
import { getRealDrivingDistance } from "./ngo.donations.$id"; // Reuses your distance calculation engine

export const Route = createFileRoute("/ngo/donations/$id/success")({
  head: () => ({ meta: [{ title: "Donation Claimed — SurplusLink" }] }),
  component: ClaimSuccess,
});

function ClaimSuccess() {
  const { id } = Route.useParams();
  
  // Real-time calculated state variables mirroring the parent details pattern
  const [donorName, setDonorName] = useState<string>("Loading...");
  const [pickupBefore, setPickupBefore] = useState<string>("Loading...");
  const [distanceText, setDistanceText] = useState<string>("Calculating...");
  const [ngoInitials, setNgoInitials] = useState<string>("HS");

  // Effect to handle both changing database status and pulling fresh summary data
  useEffect(() => {
    let isMounted = true;

    async function processClaimAndFetchData() {
      try {
        // 1. Database State Update: Ensure the record is transitioned securely to "Claimed"
        if (id) {
          // Attempt using the utility wrapper
          await updateDonationStatus(id, "Claimed");
          
          // Direct fallback patch step verifying state persistence directly inside table schema
          await supabase
            .from("donation_batches")
            .update({ status: "Claimed" })
            .eq("id", id);
        }

        // 2. Fetch User Identity Profiles & Address for maps metrics engine
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;

        let ngoAddress = "";
        if (user) {
          const { data: ngoProfile } = await supabase
            .from("ngos")
            .select("organization_name, address")
            .eq("id", user.id)
            .single();
            
          if (ngoProfile && isMounted) {
            ngoAddress = ngoProfile.address || "";
            if (ngoProfile.organization_name) {
              setNgoInitials(ngoProfile.organization_name.substring(0, 2).toUpperCase());
            }
          }
        }

        // 3. Query matching data pipelines to pull raw parameters for the dynamic success receipt block
        const { data, error } = await supabase
          .from("donation_batches")
          .select(`
            collection_datetime,
            donors (
              organization_name,
              address
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data && isMounted) {
          const rawBatch = data as any;
          const donorInfo = Array.isArray(rawBatch.donors) ? rawBatch.donors[0] : rawBatch.donors;
          
          const formattedDonor = donorInfo?.organization_name || "Anonymous Donor";
          const formattedDeadline = rawBatch.collection_datetime 
            ? new Date(rawBatch.collection_datetime).toLocaleString() 
            : "N/A";
          
          setDonorName(formattedDonor);
          setPickupBefore(formattedDeadline);

          // Re-evaluate your distance matrix matching parent profile strings
          const pickupLocation = donorInfo?.address;
          if (ngoAddress && pickupLocation && pickupLocation !== "Location not specified") {
            const calculatedDistance = await getRealDrivingDistance(ngoAddress, pickupLocation);
            setDistanceText(calculatedDistance);
          } else {
            setDistanceText("Distance unknown");
          }
        }
      } catch (err) {
        console.error("Error loading success summary context:", err);
      }
    }

    processClaimAndFetchData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel={ngoInitials} />
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <span className="text-2xl text-emerald-600">✓</span>
        </div>
        <h1 className="mt-6 text-xl font-semibold">Donation Successfully Claimed!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your organisation has been assigned this donation batch.
        </p>

        <div className="mt-6 rounded-xl border bg-card p-5 text-left text-sm">
          <Row label="Donation ID" value={`#${id.toUpperCase().slice(0, 8)}`} />
          <Row label="Donor" value={donorName} />
          <Row label="Pickup Before" value={pickupBefore} />
          <Row label="Distance" value={distanceText} />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Please proceed to the donor location before the pickup deadline. The donor has been notified.
        </p>

        <div className="mt-6 flex gap-3">
          <Link to="/ngo/dashboard" className="flex-1 rounded-md border py-2 text-sm transition-colors hover:bg-secondary text-center block">
            Back to Dashboard
          </Link>
          <Link
            to="/ngo/track/$id"
            params={{ id }}
            className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 text-center block"
          >
            Track Delivery →
          </Link>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[65%] truncate text-right font-medium text-foreground">{value}</span>
    </div>
  );
}