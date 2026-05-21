import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, donorNav } from "@/components/AppHeader";
import { getLastSubmittedBatchId } from "@/lib/donations";

export const Route = createFileRoute("/donor/donate/success")({
  head: () => ({ meta: [{ title: "Donation Submitted — SurplusLink" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const [submittedBatchId, setSubmittedBatchId] = useState<string>("#DN-0000");

  useEffect(() => {
    const id = getLastSubmittedBatchId();
    if (id) {
      setSubmittedBatchId(id);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={donorNav} userLabel="FM" />
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <span className="text-2xl text-[color:var(--success)]">✓</span>
        </div>
        <h1 className="mt-6 text-xl font-semibold">Donation Successfully Submitted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your batch <b>{submittedBatchId}</b> has been added to our network. Verified NGOs nearby
          have been notified and can claim it.
        </p>
        <Link
          to="/donor/dashboard"
          className="mt-8 inline-block rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Return to Dashboard
        </Link>
      </main>
    </div>
  );
}
