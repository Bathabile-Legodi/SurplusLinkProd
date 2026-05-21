import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppHeader, donorNav } from "@/components/AppHeader";

export const Route = createFileRoute("/donor/donate/review")({
  head: () => ({ meta: [{ title: "Review Donation — SurplusLink" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={donorNav} userLabel="FM" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-xl font-semibold">Review Donation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify your batch and contents before officially submitting the batch.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <Stat label="Mixed Donation" value="Today, 10:00 PM" />
          <Stat label="Total Weight" value="25 Kg" />
        </div>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Items in this batch (0)</h2>
          <ul className="divide-y text-sm">
            <li className="py-3 text-sm text-muted-foreground">No items have been added to this batch yet.</li>
          </ul>
        </section>

        <div className="mt-6 flex justify-between">
          <Link to="/donor/donate/batch" className="rounded-md border px-4 py-2 text-sm hover:bg-secondary">
            Edit Items
          </Link>
          <button
            onClick={() => navigate({ to: "/donor/donate/success" })}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Submit Donation Batch
          </button>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

function Row({ name, qty, expiry }: { name: string; qty: string; expiry: string }) {
  return (
    <li className="flex justify-between py-3">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">Exp: {expiry}</p>
      </div>
      <p className="text-muted-foreground">{qty}</p>
    </li>
  );
}
