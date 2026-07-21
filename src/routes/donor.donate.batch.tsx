import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { Field } from "@/components/Field";
import { DatePicker } from "@/components/ScrollPicker";
import { loadCurrentBatch, saveCurrentBatch, makeItemId, type DonationItem } from "@/lib/donations";
import { X } from "lucide-react";

// Extending the interface locally if your types file doesn't have it yet
interface ManagedDonationItem extends DonationItem {
  status?: "Active" | "Expired";
}

export const Route = createFileRoute("/donor/donate/batch")({
  head: () => ({ meta: [{ title: "Create Donation Batch — SurplusLink" }] }),
  component: CreateBatch,
});

const CATEGORIES = ["Produce", "Bakery", "Dairy", "Prepared Meals", "Canned Goods", "Meat", "Beverages", "Snacks"];

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
  const [items, setItems] = useState<ManagedDonationItem[]>([]);
  const [resetKey, setResetKey] = useState(0);

  // 1. Check expiration times on component mount and update statuses
  useEffect(() => {
    const stored = loadCurrentBatch() as ManagedDonationItem[];
    if (stored && stored.length > 0) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      
      const updatedItems = stored.map((item) => {
        if (item.expiry) {
          // Extracts just the date portion if it's an ISO timestamp
          const expiryDate = item.expiry.split("T")[0];
          if (expiryDate < today) {
            return { ...item, status: "Expired" as const };
          }
        }
        return { ...item, status: item.status || "Active" };
      });
      
      setItems(updatedItems);
    }
  }, []);

  const [draft, setDraft] = useState<Omit<ManagedDonationItem, "id"> & { categories: string[] }>({
    name: "",
    category: "Produce",
    categories: [],
    quantity: "",
    unit: "",
    expiry: "",
    status: "Active"
  });

  useEffect(() => {
    if (items.length > 0) {
      saveCurrentBatch(items);
    }
  }, [items]);

  const addItem = () => {
    if (!draft.name || draft.categories.length === 0) return;
    
    // 2. Compute status directly when item is generated
    const today = new Date().toISOString().split("T")[0];
    let finalStatus: "Active" | "Expired" = "Active";
    
    if (draft.expiry) {
      const expiryDate = draft.expiry.split("T")[0];
      if (expiryDate < today) {
        finalStatus = "Expired";
      }
    }

    const item: ManagedDonationItem = {
      id: makeItemId(),
      name: draft.name,
      category: draft.categories.join(", "),
      quantity: draft.quantity,
      unit: draft.unit,
      expiry: draft.expiry,
      status: finalStatus,
    };

    setItems([...items, item]);
    setDraft({ name: "", category: "Produce", categories: [], quantity: "", unit: "", expiry: "", status: "Active" });
    setResetKey(k => k + 1);
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
            <Field label="Food Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="e.g. Whole grain bread" />

            <CategorySelector
              selected={draft.categories}
              onChange={(cats) => setDraft({ ...draft, categories: cats })}
            />

            <Field label="Quantity" value={draft.quantity} onChange={(v) => setDraft({ ...draft, quantity: v })} placeholder="e.g. 10" />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Expiry (optional)</label>
              <DatePicker
                key={resetKey}
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{it.name}</p>
                      {/* 3. Render Status Badge UI */}
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider
                        ${it.status === "Expired" 
                          ? "bg-destructive/10 text-destructive border border-destructive/20" 
                          : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"}`}
                      >
                        {it.status}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {it.category.split(", ").map(c => (
                        <span key={c} className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right mr-3">
                    <p className="font-semibold">{it.quantity}</p>
                    {it.expiry ? (
                      <p className={`text-[10px] ${it.status === "Expired" ? "text-destructive font-medium" : "text-muted-foreground"}`}>
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