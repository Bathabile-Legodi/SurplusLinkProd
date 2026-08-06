import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/update-password")({
  head: () => ({
    meta: [{ title: "Update Password — SurplusLink" }],
  }),
  component: UpdatePassword,
});

function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there is an error in the hash fragment (e.g., link expired)
    const hash = window.location.hash;
    if (hash.includes("error_description=")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const description = params.get("error_description");
      if (description) {
        setErrorMsg(decodeURIComponent(description.replace(/\+/g, " ")));
      }
    }
  }, []);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Supabase uses the recovery session automatically created from clicking the email link
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccessMsg("Password successfully updated! Redirecting to login...");
    setTimeout(() => {
      navigate({ to: "/login" });
    }, 2000);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">SurplusLink</h1>
          <h2 className="text-sm font-medium text-muted-foreground mt-1">
            Set Your New Password
          </h2>
        </div>

        {errorMsg && (
          <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="rounded-md bg-emerald-500/15 p-3 text-xs text-emerald-600 font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}