import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Field } from "@/components/Field";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type LoginErrors = { email?: string; password?: string };

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function LoginPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<"donor" | "ngo">("donor");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validate(fields = form): LoginErrors {
    const e: LoginErrors = {};
    if (!fields.email) {
      e.email = "Email is required.";
    } else if (!isValidEmail(fields.email)) {
      e.email = "Enter a valid email address.";
    }
    if (!fields.password) {
      e.password = "Password is required.";
    }
    return e;
  }

  function handleBlur(field: keyof typeof form) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate());
  }

  function handleChange(field: keyof typeof form, value: string) {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) setErrors(validate(next));
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Mark all as touched and validate
    setTouched({ email: true, password: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (error) {
      // Map Supabase error messages to friendly field-level errors
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login") || msg.includes("invalid credentials") || msg.includes("wrong") || msg.includes("password")) {
        setErrors({ password: "Incorrect email or password." });
      } else if (msg.includes("email")) {
        setErrors({ email: error.message });
      } else {
        toast.error(error.message);
      }
      return;
    }

    const userRole = data.user.user_metadata.role;

    if (userRole !== tab) {
      await supabase.auth.signOut();
      toast.error(`This account is registered as a ${userRole.toUpperCase()}, not a ${tab.toUpperCase()}.`);
      return;
    }

    toast.success("Successfully logged in!");
    navigate({ to: tab === "donor" ? "/donor/dashboard" : "/ngo/dashboard" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">SurplusLink</h1>
        </div>

        {/* Role Switch */}
        <div className="mb-6 grid grid-cols-2 rounded-md bg-secondary p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab("donor")}
            className={`rounded py-1.5 transition ${tab === "donor" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Donor
          </button>
          <button
            type="button"
            onClick={() => setTab("ngo")}
            className={`rounded py-1.5 transition ${tab === "ngo" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            NGO
          </button>
        </div>

        <form onSubmit={handleLogin} noValidate className="space-y-4">
          <Field
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(v) => handleChange("email", v)}
            placeholder="you@example.com"
            error={touched.email ? errors.email : undefined}
          />

          {/* Password with show/hide toggle */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground">Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                placeholder="••••••••"
                className={`w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors
                  ${touched.password && errors.password
                    ? "border-destructive focus:ring-destructive"
                    : "border-input focus:border-ring focus:ring-ring"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="text-[11px] text-destructive leading-tight">{errors.password}</p>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Logging in…" : tab === "donor" ? "Login as Donor" : "Login as NGO"}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-muted-foreground flex flex-col gap-2">
          <Link to="/forgot-password" className="hover:text-foreground hover:underline">
            Forgot Password?
          </Link>
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-foreground hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}