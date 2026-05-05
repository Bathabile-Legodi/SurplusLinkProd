import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppHeader, ngoNav } from "@/components/AppHeader";

export const Route = createFileRoute("/ngo/donations/$id")({
  head: () => ({ meta: [{ title: "Donation Details — SurplusLink" }] }),
  component: DonationDetail,
});

function DonationDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel="HS" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/ngo/explore" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Available Donations
        </Link>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="aspect-square rounded-xl border bg-secondary" />
          <div>
            <h1 className="text-xl font-semibold capitalize">{id.replace(/-/g, " ")}</h1>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Quantity" value="20 Kg" />
              <Row label="Expiry Time" value="Today, 8:00 PM" />
              <Row label="Donor" value="Fresh Market — Pickering Centre" />
              <Row label="Location" value="1.2 km away" />
            </dl>
          </div>
        </div>

        <section className="mt-8 rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold">About This Donation</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A mix of fresh vegetables including carrots, lettuce, broccoli and tomatoes.
            Collected from morning storefront — quality checked and ready for distribution.
          </p>
        </section>

        <button
          onClick={() => navigate({ to: "/ngo/donations/$id/claim", params: { id } })}
          className="mt-6 w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Claim Donation
        </button>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
