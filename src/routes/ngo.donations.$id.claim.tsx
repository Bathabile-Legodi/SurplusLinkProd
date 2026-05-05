import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/ngo/donations/$id/claim")({
  head: () => ({ meta: [{ title: "Processing Claim — SurplusLink" }] }),
  component: ClaimProcessing,
});

function ClaimProcessing() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Demo branching: if id contains 'bakery' simulate already claimed; if 'dairy' not verified.
    const t1 = setTimeout(() => setStep(1), 700);
    const t2 = setTimeout(() => setStep(2), 1400);
    const t3 = setTimeout(() => {
      if (id.includes("bakery")) navigate({ to: "/ngo/donations/$id/unavailable", params: { id } });
      else if (id.includes("dairy")) navigate({ to: "/ngo/not-verified" });
      else navigate({ to: "/ngo/donations/$id/success", params: { id } });
    }, 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [id, navigate]);

  const checks = [
    "Verifying NGO account",
    "Checking donation availability",
    "Reserving your claim window",
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-foreground/40 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-primary" />
        <h1 className="mt-6 text-base font-semibold">Processing Your Claim</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Please wait while we verify and reserve this donation.
        </p>
        <ul className="mt-6 space-y-2 text-left text-sm">
          {checks.map((c, i) => (
            <li key={c} className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  i <= step ? "bg-success/20 text-[color:var(--success)]" : "bg-secondary text-muted-foreground"
                }`}
              >
                {i <= step ? "✓" : i + 1}
              </span>
              <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
