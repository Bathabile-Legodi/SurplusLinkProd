import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Field } from "@/components/Field";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<"donor" | "ngo">("donor");

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false); // tracks if the password is visible or not

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const userRole = data.user.user_metadata.role;

    // prevents NGO logging into donor section and vice versa
    if (userRole !== tab) {
      await supabase.auth.signOut();

      toast.error(`This account belongs to a ${userRole.toUpperCase()}`);

      return;
    }

    // redirect based on selected role
    toast.success("Successfully logged in!");
    if (tab === "donor") {
      navigate({ to: "/donor/dashboard" });
    } else {
      navigate({ to: "/ngo/dashboard" });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            SurplusLink
          </h1>
        </div>

        {/* Role Switch */}
        <div className="mb-6 grid grid-cols-2 rounded-md bg-secondary p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab("donor")}
            className={`rounded py-1.5 transition ${
              tab === "donor"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            Donor 
          </button>

          <button
            type="button"
            onClick={() => setTab("ngo")}
            className={`rounded py-1.5 transition ${
              tab === "ngo"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            NGO 
          </button>
        </div>

        <form
        onSubmit={handleLogin}
        className="space-y-4"
        >
        <Field
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(v: string) =>
            setForm({
                ...form,
                email: v,
            })
            }
            placeholder="you@example.com"
        />

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        
        <button
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
            {loading
            ? "Logging in..."
            : tab === "donor"
                ? "Login as Donor"
                : "Login as NGO"}
        </button>
        </form>
        <div className="mt-5 text-center text-xs text-muted-foreground flex flex-col gap-2">
        <Link
            to="/forgot-password"
            className="hover:text-foreground hover:underline"
        >
            Forgot Password?
        </Link>
        
        <p>
            Don’t have an account?{" "}
            <Link
            to="/register"
            className="font-medium text-foreground hover:underline"
            >
            Register
            </Link>
        </p>
        </div>
      </div>
    </main>
  );
}