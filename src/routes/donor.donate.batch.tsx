import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { Field } from "@/components/Field";
import { loadCurrentBatch, saveCurrentBatch, makeItemId, type DonationItem } from "@/lib/donations";

export const Route = createFileRoute("/donor/donate/batch")({
  head: () => ({ meta: [{ title: "Create Donation Batch — SurplusLink" }] }),
  component: CreateBatch,
});

const emptyDraft = (): DonationItem => ({
  id: "",
  name: "",
  category: "Produce",
  quantity: "",
  unit: "Kg",
  expiry: ""
});

function CreateBatch() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DonationItem[]>([]);

  // Load stored batch only on client to avoid SSR hydration mismatches
  useEffect(() => {
    const stored = loadCurrentBatch();
    if (stored && stored.length > 0) {
      setItems(stored);
    }
  }, []);

  const [draft, setDraft] = useState<DonationItem>(emptyDraft()); 
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    saveCurrentBatch(items);
  }, [items]);

  const isEditing = editingId !== null; 

  function handleAddOrUpdate() {
    if (!draft.name.trim() || !draft.expiry) return;

    if (isEditing) {
      setItems(items.map((it) => (it.id === editingId ? { ...draft, id: editingId } : it)));
      setEditingId(null);
    } else {
      setItems([...items, { ...draft, id: makeItemId() }]);
    }
    setDraft(emptyDraft());
  }

  function handleEdit(item: DonationItem) {
    setDraft(item);
    setEditingId(item.id);
  }

  function handleDelete(id: string) {
    setItems(items.filter((it) => it.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setDraft(emptyDraft());
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft());
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={donorNav} userLabel="FM" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="mt-1 text-sm text-muted-foreground">
          Add individual items to your current batch before submitting.
        </p>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">
            {isEditing ? "Edit Item" : "Item Details"} 
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <Field label="Food Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="e.g. Whole grain bread" />
            </div>

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
<<<<<<< HEAD
      
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Expiry Date</label>
              <input
=======

            {/* 3. Expiry (optional) - keep per-item expiry, collection deadline moved to review page */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Expiry (optional)</label>
              <input 
>>>>>>> 02760936bc800240cdd0cbd5683c89c117c833c3
                type="date"
                value={draft.expiry}
                onChange={(e) => setDraft({ ...draft, expiry: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

<<<<<<< HEAD
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleAddOrUpdate}
              className="flex-1 rounded-md border border-dashed border-primary/50 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              {isEditing ? "Update Item" : "+ Add Item to Batch"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-md border px-4 py-3 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
=======
          <button
            type="button"
            onClick={() => {
              if (!draft.name) return;
              setItems([...items, draft]);
              setDraft({ name: "", category: "Produce", quantity: "", unit: "Kg", expiry: "" });
            }}
            className="mt-6 w-full rounded-md border border-dashed border-primary/50 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            + Add Item to Batch
          </button>
>>>>>>> 02760936bc800240cdd0cbd5683c89c117c833c3
        </section>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-3 text-sm font-semibold">Items in this batch ({items.length})</h2>
          <ul className="divide-y">
            {items.map((it) => ( 
              <li key={it.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{it.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{it.quantity} {it.unit}</p>
<<<<<<< HEAD
                  <p className="text-[10px] text-muted-foreground">Exp: {it.expiry}</p> 
                </div>
          
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleEdit(it)} className="text-xs font-medium text-primary hover:underline">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(it.id)} className="text-xs font-medium text-destructive hover:underline">
                    Delete
                  </button>
=======
                  {it.expiry ? (
                    <p className="text-[10px] text-muted-foreground">
                      Exp: {it.expiry.replace?.('T', ' ') ?? it.expiry}
                    </p>
                  ) : null}
>>>>>>> 02760936bc800240cdd0cbd5683c89c117c833c3
                </div>
              </li>
            ))}
          </ul>
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
