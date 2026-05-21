import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { Field } from "./index";
import { loadCurrentBatch, saveCurrentBatch, type DonationItem } from "@/lib/donations";

export const Route = createFileRoute("/donor/donate/batch")({
  head: () => ({ meta: [{ title: "Create Donation Batch — SurplusLink" }] }),
  component: CreateBatch,
});

function CreateBatch() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DonationItem[]>(() => {
    const stored = loadCurrentBatch();
    return stored.length >= 0
      ? stored
      : [];
  });

  const [draft, setDraft] = useState<DonationItem>({ 
    name: "", 
    category: "Produce", 
    quantity: "", 
    unit: "Kg", 
    expiry: "" 
  });

  useEffect(() => {
    saveCurrentBatch(items);
  }, [items]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={donorNav} userLabel="FM" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="mt-1 text-sm text-muted-foreground">
          Add individual items to your current batch before submitting.
        </p>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Item Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <Field label="Food Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="e.g. Whole grain bread" />
            </div>

            {/* 1. DROP DOWN MENU for Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Category</label>
              <select 
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Produce">Produce</option>
                <option value="Bakery">Bakery</option>
                <option value="Dairy">Dairy</option>
                <option value="Prepared Meals">Prepared Meals</option>
                <option value="Canned Goods">Canned Goods</option>
              </select>
            </div>

            <Field label="Quantity" value={draft.quantity} onChange={(v) => setDraft({ ...draft, quantity: v })} placeholder="10" />

            {/* 2. DROP DOWN MENU for Unit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Unit</label>
              <select 
                value={draft.unit}
                onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Kg">Kg</option>
                <option value="Units">Units</option>
                <option value="Litres">Litres</option>
                <option value="Trays">Trays</option>
              </select>
            </div>

            {/* 3. DATE & TIME PICKER for Expiry/Deadline */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Collection Deadline / Expiry</label>
              <input 
                type="datetime-local"
                value={draft.expiry}
                onChange={(e) => setDraft({ ...draft, expiry: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!draft.name || !draft.expiry) return;
              setItems([...items, draft]);
              setDraft({ name: "", category: "Produce", quantity: "", unit: "Kg", expiry: "" });
            }}
            className="mt-6 w-full rounded-md border border-dashed border-primary/50 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            + Add Item to Batch
          </button>
        </section>

        {/* Display List Section */}
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
                  <p className="font-semibold">{it.quantity} {it.unit}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Exp: {it.expiry.replace('T', ' ')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between gap-4">
          <Link to="/donor/dashboard" className="rounded-md border px-6 py-2 text-sm font-medium hover:bg-secondary transition-colors">
            Cancel
          </Link>
          <button
            onClick={() => navigate({ to: "/donor/donate/review" })}
            disabled={items.length === 0}
            className="flex-1 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            Finish & Review Batch
          </button>
        </div>
      </main>
    </div>
  );
}