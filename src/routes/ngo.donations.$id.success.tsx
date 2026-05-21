import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { updateDonationStatus } from "@/lib/donations";

export const Route = createFileRoute("/ngo/donations/$id/success")({
  head: () => ({ meta: [{ title: "Donation Claimed — SurplusLink" }] }),
  component: ClaimSuccess,
});

function ClaimSuccess() {
  const { id } = Route.useParams();

  useEffect(() => {
    if (id) {
      updateDonationStatus(id, "Claimed");
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel="HS" />
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <span className="text-2xl text-[color:var(--success)]">✓</span>
        </div>
        <h1 className="mt-6 text-xl font-semibold">Donation Successfully Claimed!</h1>

        <div className="mt-6 rounded-xl border bg-card p-5 text-left text-sm">
          <Row label="Donation ID" value={`#${id.toUpperCase().slice(0, 8)}`} />
          <Row label="Donor" value="Fresh Market" />
          <Row label="Pickup By" value="Today, 8:00 PM" />
          <Row label="Distance" value="1.2 km" />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Please proceed to the donor location before pickup time. The donor has been notified.
        </p>

        <div className="mt-6 flex gap-3">
          <Link to="/ngo/dashboard" className="flex-1 rounded-md border py-2 text-sm hover:bg-secondary">
            Back to Dashboard
          </Link>
          <Link
            to="/ngo/claims"
            className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View My Claims
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
      <span className="font-medium">{value}</span>
    </div>
  );
}
