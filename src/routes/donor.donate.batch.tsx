import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { Field } from "./index";

export const Route = createFileRoute("/donor/donate/batch")({
  head: () => ({ meta: [{ title: "Create Donation Batch — SurplusLink" }] }),
  component: CreateBatch,
});

type Item = { name: string; category: string; quantity: string; unit: string; expiry: string };

function CreateBatch() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([
    { name: "Loaves of Brown Bread", category: "Bakery", quantity: "18", unit: "Units", expiry: "Today, 10:00 PM" },
    { name: "Assorted Seasonal Fruit", category: "Produce", quantity: "10", unit: "Kg", expiry: "Tomorrow" },
  ]);
  const [draft, setDraft] = useState<Item>({ name: "", category: "", quantity: "", unit: "Kg", expiry: "" });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={donorNav} userLabel="FM" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-xl font-semibold">Create Donation Batch</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add individual items to your current batch before submitting.
        </p>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Item Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Food Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="e.g. Whole grain bread" />
            <Field label="Category" value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} placeholder="Bakery / Produce" />
            <Field label="Quantity" value={draft.quantity} onChange={(v) => setDraft({ ...draft, quantity: v })} placeholder="10" />
            <Field label="Unit" value={draft.unit} onChange={(v) => setDraft({ ...draft, unit: v })} placeholder="Kg / Units" />
            <div className="col-span-2">
              <Field label="Expiry Date / Time" value={draft.expiry} onChange={(v) => setDraft({ ...draft, expiry: v })} placeholder="Today, 10:00 PM" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!draft.name) return;
              setItems([...items, draft]);
              setDraft({ name: "", category: "", quantity: "", unit: "Kg", expiry: "" });
            }}
            className="mt-4 w-full rounded-md border border-dashed py-2 text-sm font-medium hover:bg-secondary/50"
          >
            + Add Item to Batch
          </button>
        </section>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-3 text-sm font-semibold">Items in this batch ({items.length})</h2>
          <ul className="divide-y">
            {items.map((it, i) => (
              <li key={i} className="grid grid-cols-2 gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{it.category}</p>
                </div>
                <div className="text-right">
                  <p>{it.quantity} {it.unit}</p>
                  <p className="text-xs text-muted-foreground">Exp: {it.expiry}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6 flex justify-between">
          <Link to="/donor/dashboard" className="rounded-md border px-4 py-2 text-sm hover:bg-secondary">
            Cancel
          </Link>
          <button
            onClick={() => navigate({ to: "/donor/donate/review" })}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Finish & Review Batch
          </button>
        </div>
      </main>
    </div>
  );
}
