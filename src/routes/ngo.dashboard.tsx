import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { useNgoVerification } from "@/hooks/useNgoVerification";

export const Route = createFileRoute("/ngo/dashboard")({
  head: () => ({ meta: [{ title: "NGO Dashboard — SurplusLink" }] }),
  component: NgoDashboard,
});

function NgoDashboard() {
  const { isAuthorized, isChecking } = useNgoVerification();

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel="HS" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">NGO Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back, Hope Shelter.</p>

        <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-5">
          <p className="text-sm font-semibold">Account Pending Approval</p>
          <p className="mt-1 text-xs text-muted-foreground">
            To complete the approval for 3-7 working days for our team to validate your application.
            Once verified, your organization will receive a notification and full access to claim donations.
          </p>
          <div className="mt-3 flex gap-3">
            <button className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              View Status
            </button>
            <Link
              to="/ngo/explore"
              className="rounded-md border px-4 py-1.5 text-xs font-medium hover:bg-secondary"
            >
              Log Out
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Stat label="Available nearby" value="12" />
          <Stat label="Claims this week" value="4" />
          <Stat label="Meals served" value="320" />
        </div>

        <div className="mt-8">
          <Link
            to="/ngo/explore"
            className="inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Explore Available Donations →
          </Link>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}