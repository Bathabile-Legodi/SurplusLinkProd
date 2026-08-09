import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { requireRole } from "@/lib/auth-guard";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/donor/donate/consent")({
  beforeLoad: () => requireRole("donor"),
  head: () => ({ meta: [{ title: "Donation Consent — SurplusLink" }] }),
  component: ConsentPage,
});

function ConsentPage() {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const { displayName } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-foreground/40 px-4 py-10">
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 shadow-xl">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">SurplusLink</p>
          <h1 className="mt-1 text-lg font-semibold">Welcome, {displayName}</h1>
        </div>

        <h2 className="text-base font-semibold">Donation Consent & Declaration Form</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          By proceeding to log a donation, your affiliate confirms that:
        </p>

        <ul className="mt-4 space-y-2.5 text-sm">
          {[
            "The food being donated is safe for human consumption.",
            "Pre-weight, category and expiry information is accurate.",
            "Your business / your organization is protected from liability.",
            "I have read and agree to the donation terms.",
          ].map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-0.5 text-[color:var(--success)]">✓</span>
              <span className="text-foreground">{t}</span>
            </li>
          ))}
        </ul>

        <label className="mt-5 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1"
          />
          <span>I have read and agree to the declaration above.</span>
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            to="/donor/dashboard"
            className="rounded-md border px-4 py-2 text-sm hover:bg-secondary"
          >
            Cancel
          </Link>
          <button
            disabled={!agreed}
            onClick={() => navigate({ to: "/donor/donate/batch" })}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            Continue to Donation
          </button>
        </div>
      </div>
    </div>
  );
}
