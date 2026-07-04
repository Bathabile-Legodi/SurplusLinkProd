import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { loadAllDonations, formatDonationTime, type RecentDonation } from "@/lib/donations";
import { Package, CalendarClock, ChevronDown, ChevronUp, Search, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/donor/history")({
  head: () => ({ meta: [{ title: "Donation History — SurplusLink" }] }),
  component: DonorHistory,
});

function formatBatchId(id: number) {
  return `#${id.toString().padStart(3, "0")}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending:   "bg-amber-100 text-amber-700 border-amber-200",
    Claimed:   "bg-blue-100 text-blue-700 border-blue-200",
    Delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Expired:   "bg-neutral-100 text-neutral-500 border-neutral-200",
    Cancelled: "bg-red-100 text-red-600 border-red-200",
  };
  const cls = styles[status] ?? "bg-neutral-100 text-neutral-500 border-neutral-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function DonationRow({ d }: { d: RecentDonation }) {
  const [expanded, setExpanded] = useState(false);

  const collectionLabel = d.collectionDateTime
    ? formatDonationTime(d.collectionDateTime)
    : "—";

  return (
    <div className="rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-sm">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        {/* Batch icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Package className="h-5 w-5" />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{formatBatchId(d.id)}</span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-sm text-muted-foreground truncate">{d.category}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3 shrink-0" />
            <span>Submitted {d.time}</span>
          </div>
        </div>

        {/* Status + items count + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:block text-xs text-muted-foreground">
            {d.items.length} item{d.items.length !== 1 ? "s" : ""}
          </span>
          <StatusBadge status={d.status} />
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t bg-secondary/40 px-5 py-4 space-y-4">
          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Meta label="Batch ID" value={formatBatchId(d.id)} />
            <Meta label="Status" value={d.status} />
            <Meta label="Collection Deadline" value={collectionLabel} />
            <Meta label="Total Items" value={String(d.items.length)} />
          </div>

          {/* Items table */}
          {d.items.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Items in batch
              </p>
              <div className="overflow-hidden rounded-lg border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {d.items.map((item) => (
                      <tr key={item.id} className="hover:bg-secondary/50">
                        <td className="px-4 py-2 font-medium">{item.name}</td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {item.category.split(", ").map((c) => (
                              <span
                                key={c}
                                className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {item.expiry ? item.expiry.replace("T", " ") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

const STATUS_OPTIONS = ["All", "Pending", "Claimed", "Delivered", "Expired", "Cancelled"];

function DonorHistory() {
  const [donations, setDonations] = useState<RecentDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    loadAllDonations().then((d) => {
      setDonations(d);
      setLoading(false);
    });
  }, []);

  const filtered = donations.filter((d) => {
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      d.category.toLowerCase().includes(q) ||
      d.items.some(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    return matchesStatus && matchesSearch;
  });

  // Summary counts
  const total = donations.length;
  const delivered = donations.filter((d) => d.status === "Delivered").length;
  const pending = donations.filter((d) => d.status === "Pending").length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={donorNav} userLabel="FM" />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Donation History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A complete record of every batch you've submitted.
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="mt-0.5 text-xs text-muted-foreground uppercase tracking-wide">Total Batches</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{delivered}</p>
            <p className="mt-0.5 text-xs text-muted-foreground uppercase tracking-wide">Delivered</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
            <p className="mt-0.5 text-xs text-muted-foreground uppercase tracking-wide">Pending</p>
          </div>
        </div>

        {/* Search + filter bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by item name, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border bg-card pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex gap-1 flex-wrap">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl border bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border bg-card py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No donations found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {donations.length === 0
                ? "You haven't submitted any batches yet."
                : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => (
              <DonationRow key={d.batchId} d={d} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
