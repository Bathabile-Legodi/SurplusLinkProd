import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader, ngoNav } from "@/components/AppHeader";

export const Route = createFileRoute("/ngo/claims")({
  head: () => ({ meta: [{ title: "My Claimed Donations — SurplusLink" }] }),
  component: MyClaims,
});

const claims = [
  { id: "fresh-vegetables", donor: "Fresh Market", time: "Pickup • Today, 8:00 PM", status: "In Transit" },
  { id: "sunrise-bakery", donor: "Sunrise Bakery", time: "Claimed • Yesterday", status: "Delivered" },
];

function MyClaims() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel="HS" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-xl font-semibold">My Claimed Donations</h1>

        <h2 className="mt-6 text-xs uppercase tracking-wide text-muted-foreground">Active</h2>
        <ul className="mt-2 space-y-3">
          {claims.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
              <div>
                <p className="font-medium capitalize">{c.id.replace(/-/g, " ")}</p>
                <p className="text-xs text-muted-foreground">{c.donor} • {c.time}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  c.status === "Delivered"
                    ? "bg-success/15 text-[color:var(--success)]"
                    : "bg-warning/20 text-foreground"
                }`}>{c.status}</span>
                <Link
                  to="/ngo/track/$id"
                  params={{ id: c.id }}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Track →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
