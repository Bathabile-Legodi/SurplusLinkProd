import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/ngo/donations/$id/claim")({
  head: () => ({ meta: [{ title: "Processing Claim — SurplusLink" }] }),
  component: ClaimProcessing,
});

const CHECKS = [
  "Verifying NGO account",
  "Checking donation availability",
  "Reserving your claim",
];

function ClaimProcessing() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function processClaim() {
      // Step 1: verify NGO
      await delay(600);
      setStep(1);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/ngo/not-verified" });
        return;
      }

      // Step 2: check batch availability
      await delay(700);
      setStep(2);

      const { data: batch, error: fetchError } = await supabase
        .from("donation_batches")
        .select("id, status, claimed_by")
        .eq("id", id)
        .single();

      if (fetchError || !batch) {
        setErrorMsg("Donation not found.");
        return;
      }

      if (batch.status !== "Unclaimed" && batch.claimed_by !== null) {
        navigate({ to: `/ngo/donations/${id}/unavailable` });
        return;
      }

      // Step 3: reserve the claim
      await delay(700);
      setStep(3);

      const { error: claimError } = await supabase
        .from("donation_batches")
        .update({
          status: "Claimed",
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "Unclaimed"); // optimistic concurrency — only claim if still unclaimed

      if (claimError) {
        // Race condition: someone else just claimed it
        navigate({ to: `/ngo/donations/${id}/unavailable` });
        return;
      }

      await delay(400);
      navigate({ to: `/ngo/donations/${id}/success` });
    }

    processClaim();
  }, [id, navigate]);

  if (errorMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foreground/40 px-4">
        <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-center shadow-xl">
          <p className="text-sm font-semibold text-destructive">Something went wrong</p>
          <p className="mt-2 text-xs text-muted-foreground">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-foreground/40 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-primary" />
        <h1 className="mt-6 text-base font-semibold">Processing Your Claim</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Please wait while we verify and reserve this donation.
        </p>
        <ul className="mt-6 space-y-2 text-left text-sm">
          {CHECKS.map((c, i) => (
            <li key={c} className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  i < step
                    ? "bg-emerald-100 text-emerald-700"
                    : i === step
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
