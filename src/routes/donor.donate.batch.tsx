import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { Field } from "@/components/Field";
import { DatePicker } from "@/components/ScrollPicker";
import { loadCurrentBatch, saveCurrentBatch, type DonationItem } from "@/lib/donations";
import { X } from "lucide-react";

export const Route = createFileRoute("/donor/donate/batch")({
  head: () => ({ meta: [{ title: "Create Donation Batch — SurplusLink" }] }),
  component: CreateBatch,
});

const CATEGORIES = ["Produce", "Bakery", "Dairy", "Prepared Meals", "Canned Goods", "Meat", "Beverages", "Snacks"];
const UNITS = ["Kg", "Units", "Litres", "Trays"];

/* ─── Category Pill Selector (multi-select) ─── */

function CategorySelector({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (cat: string) => {
    if (selected.includes(cat)) {
      onChange(selected.filter(c => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Category</label>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const isActive = selected.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggle(cat)}
              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all duration-200
                ${isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.03]"
                  : "bg-background text-muted-foreground border-input hover:border-primary/50 hover:text-foreground"
                }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

function CreateBatch() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DonationItem[]>([]);

  useEffect(() => {
    const stored = loadCurrentBatch();
    if (stored && stored.length > 0) {
      setItems(stored);
    }
  }, []);

  const [draft, setDraft] = useState<DonationItem & { categories: string[] }>({
    name: "",
    category: "Produce",
    categories: [],
    quantity: "",
    unit: "Kg",
    expiry: ""
  });

  useEffect(() => {
    saveCurrentBatch(items);
  }, [items]);

  const addItem = () => {
    if (!draft.name || draft.categories.length === 0) return;
    const item: DonationItem = {
      name: draft.name,
      category: draft.categories.join(", "),
      quantity: draft.quantity,
      unit: draft.unit,
      expiry: draft.expiry,
    };
    setItems([...items, item]);
    setDraft({ name: "", category: "Produce", categories: [], quantity: "", unit: "Kg", expiry: "" });
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={donorNav} userLabel="FM" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="mt-1 text-sm text-muted-foreground">
          Add individual items to your current batch before submitting.
        </p>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Item Details</h2>
          <div className="space-y-5">
            {/* Row 1: Name */}
            <Field label="Food Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="e.g. Whole grain bread" />

            {/* Row 2: Category Pills */}
            <CategorySelector
              selected={draft.categories}
              onChange={(cats) => setDraft({ ...draft, categories: cats })}
            />

            {/* Row 3: Quantity + Unit side by side */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="Quantity" value={draft.quantity} onChange={(v) => setDraft({ ...draft, quantity: v })} placeholder="10" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Unit</label>
                <div className="flex rounded-md border border-input overflow-hidden">
                  {UNITS.map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setDraft({ ...draft, unit: u })}
                      className={`flex-1 py-2 text-xs font-medium transition-colors
                        ${draft.unit === u
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4: Expiry Date Picker (date only) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Expiry (optional)</label>
              <DatePicker
                value={draft.expiry}
                onChange={(v) => setDraft({ ...draft, expiry: v })}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addItem}
            disabled={!draft.name || draft.categories.length === 0}
            className="mt-6 w-full rounded-md border border-dashed border-primary/50 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add Item to Batch
          </button>
        </section>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-3 text-sm font-semibold">Items in this batch ({items.length})</h2>
          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No items added yet.</p>
          ) : (
            <ul className="divide-y">
              {items.map((it, i) => (
                <li key={i} className="flex items-center justify-between py-3 text-sm group">
                  <div className="flex-1">
                    <p className="font-medium">{it.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {it.category.split(", ").map(c => (
                        <span key={c} className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right mr-3">
                    <p className="font-semibold">{it.quantity} {it.unit}</p>
                    {it.expiry ? (
                      <p className="text-[10px] text-muted-foreground">
                        Exp: {it.expiry.replace?.('T', ' ') ?? it.expiry}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="rounded-full p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    title="Remove item"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

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
