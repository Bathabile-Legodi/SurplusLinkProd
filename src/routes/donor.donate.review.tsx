import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, donorNav } from "@/components/AppHeader";
import TimePicker from "@/components/TimePicker";
import { loadCurrentBatch, submitDonationBatch, type DonationItem } from "@/lib/donations";

export const Route = createFileRoute("/donor/donate/review")({
  head: () => ({ meta: [{ title: "Review Donation — SurplusLink" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DonationItem[]>([]);

  useEffect(() => {
    const stored = loadCurrentBatch();
    if (stored.length === 0) {
      navigate({ to: "/donor/donate/batch" });
      return;
    }
    setItems(stored);
  }, [navigate]);

  const batchType = items.length > 1 ? "Mixed Donation" : items[0]?.category ?? "Donation";

  // Collection deadline state (date + time separated)
  const [collectionDate, setCollectionDate] = useState<string>("");
  const [collectionTime, setCollectionTime] = useState<string>("");

  // Helper to compute min/max for date input
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;
  const maxDateObj = new Date(today);
  maxDateObj.setDate(maxDateObj.getDate() + 7);
  const maxDate = `${maxDateObj.getFullYear()}-${String(maxDateObj.getMonth() + 1).padStart(2, "0")}-${String(maxDateObj.getDate()).padStart(2, "0")}`;

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
          <h2 className="mb-4 text-sm font-semibold">Items in this batch ({items.length})</h2>
          <ul className="divide-y text-sm">
            {items.map((item, index) => (
              <Row key={index} name={item.name} qty={`${item.quantity} ${item.unit}`} expiry={item.expiry.replace("T", " ")} />
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Collection Deadline</h2>
          <p className="text-xs text-muted-foreground mb-3">Select the latest date and time when the donation can be collected (max 7 days from today).</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium">Date</label>
              <input
                type="date"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                min={minDate}
                max={maxDate}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Time</label>
              <div className="mt-1">
                <TimePicker value={collectionTime} onChange={(v) => setCollectionTime(v)} />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex justify-between">
          <Link to="/donor/donate/batch" className="rounded-md border px-4 py-2 text-sm hover:bg-secondary">
            Edit Items
          </Link>
          <button
            onClick={() => {
              if (items.length === 0) return;
              // combine date + time into ISO timestamp if available
              let deadline: string | undefined = undefined;
              if (collectionDate) {
                const timePart = collectionTime || "00:00";
                // construct in local timezone
                const iso = new Date(`${collectionDate}T${timePart}`).toISOString();
                deadline = iso;
              }
              submitDonationBatch(items, deadline);
              navigate({ to: "/donor/donate/success" });
            }}
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
