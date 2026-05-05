import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Field } from "./index";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Reset Password — SurplusLink" }],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">SurplusLink</h1>
        </div>
        <h2 className="text-base font-semibold">Reset Password</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter your registered email address. We will send you a link to reset your password.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="mt-5 space-y-4"
        >
          <Field
            label="Email Address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@business.org"
          />
          <button className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {sent ? "Reset Link Sent ✓" : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
