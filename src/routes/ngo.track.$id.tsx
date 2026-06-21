import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader, ngoNav } from "@/components/AppHeader";

export const Route = createFileRoute("/ngo/track/$id")({
  head: () => ({ meta: [{ title: "Track Delivery — SurplusLink" }] }),
  component: TrackDelivery,
});

function TrackDelivery() {
  const { id } = Route.useParams();
  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel="HS" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/ngo/claims" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Claims
        </Link>

        <h1 className="mt-4 text-xl font-semibold">Track Delivery</h1>
        <p className="text-sm text-muted-foreground capitalize">Batch: {id.replace(/-/g, " ")}</p>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            <Stage label="Claimed" detail="Today, 16:12" done />
            <Stage label="Donor Confirmed" detail="Today, 16:25" done />
            <Stage label="In Transit" detail="ETA: 17:11" active />
            <Stage label="Delivered" detail="Pending" />
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <div
              className="h-80 w-full"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, oklch(0.95 0.01 247) 0%, oklch(0.92 0.02 200) 100%)",
              }}
            >
              <svg viewBox="0 0 400 320" className="h-full w-full">
                <path
                  d="M40 260 Q 140 240, 180 180 T 360 60"
                  fill="none"
                  stroke="oklch(0.21 0.03 264)"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                />
                <circle cx="40" cy="260" r="8" fill="oklch(0.62 0.17 150)" />
                <circle cx="360" cy="60" r="8" fill="oklch(0.55 0.22 27)" />
                <circle cx="200" cy="170" r="10" fill="oklch(0.21 0.03 264)" />
                <text x="50" y="280" fontSize="11" fill="oklch(0.21 0.03 264)">Fresh Market</text>
                <text x="280" y="50" fontSize="11" fill="oklch(0.21 0.03 264)">Hope Shelter</text>
              </svg>
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">Delivery Driver Details</h2>
          <div className="text-sm space-y-1.5">
            <Row label="Driver Name" value="Sipho" />
            <Row label="Phone" value="+27 82 123 4567" />
            <Row label="Vehicle" value="Foton Truck Mate - XP 56 VD GP" />
          </div>
          <div className="mt-4 flex gap-3">
            <button className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground text-center hover:bg-primary/90">
              Call Driver
            </button>
            <button className="flex-1 rounded-md bg-green-600 py-2 text-sm font-medium text-white text-center hover:bg-green-700">
              Message Driver
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stage({ label, detail, done, active }: { label: string; detail: string; done?: boolean; active?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
      <div
        className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
          done
            ? "bg-success/20 text-[color:var(--success)]"
            : active
              ? "bg-warning/30 text-foreground"
              : "bg-secondary text-muted-foreground"
        }`}
      >
        {done ? "✓" : active ? "•" : "○"}
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
