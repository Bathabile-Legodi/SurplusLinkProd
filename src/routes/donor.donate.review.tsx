import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { loadCurrentBatch, submitDonationBatch, getErrorMessage, type DonationItem } from "@/lib/donations";

export const Route = createFileRoute("/donor/donate/review")({
  head: () => ({ meta: [{ title: "Review Donation — SurplusLink" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DonationItem[]>([]);
  const [collectionDateTime, setCollectionDateTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadCurrentBatch();
    if (stored.length === 0) {
      navigate({ to: "/donor/donate/batch" });
      return;
    }
    setItems(stored);
  }, [navigate]);

  const batchType = items.length > 1 ? "Mixed Donation" : items[0]?.category ?? "Donation";

  async function handleSubmit() {
    if (items.length === 0 || !collectionDateTime) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitDonationBatch(items, collectionDateTime);
      navigate({ to: "/donor/donate/success", search: { batchId: result.id } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={donorNav} userLabel="FM" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-xl font-semibold">Review Donation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify your batch and contents before officially submitting the batch.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <Stat label="Batch Type" value={batchType} />
          <Stat label="Items in Batch" value={`${items.length}`} />
        </div>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-3 text-sm font-semibold">Collection Date & Time</h2>
          <p className="mb-3 text-xs text-muted-foreground">When should this batch be picked up?</p>
          <input
            type="datetime-local"
            value={collectionDateTime}
            onChange={(e) => setCollectionDateTime(e.target.value)}
            className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </section>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Items in this batch ({items.length})</h2>
          <ul className="divide-y text-sm">
            {items.map((item) => (
              <Row key={item.id} name={item.name} qty={`${item.quantity} ${item.unit}`} expiry={item.expiry} />
            ))}
          </ul>
        </section>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex justify-between">
          <Link to="/donor/donate/batch" className="rounded-md border px-4 py-2 text-sm hover:bg-secondary">
            Edit Items
          </Link>
          <button
            onClick={handleSubmit}
            disabled={items.length === 0 || !collectionDateTime || submitting}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? "Submitting…" : "Submit Donation Batch"}
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