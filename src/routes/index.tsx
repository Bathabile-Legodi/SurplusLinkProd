import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SurplusLink — Sign in" },
      { name: "description", content: "Connecting food surplus with communities in need." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    // Demo routing: emails containing "ngo" go to NGO dashboard, otherwise donor.
    if (password.length < 4) {
      setError("Invalid credentials. Please check your email and password.");
      return;
    }
    if (email.toLowerCase().includes("ngo") || email.toLowerCase().includes("shelter")) {
      navigate({ to: "/ngo/dashboard" });
    } else {
      navigate({ to: "/donor/dashboard" });
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">SurplusLink</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Connecting surplus with communities in need
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-[color:var(--danger-bg)] p-3 text-xs text-destructive">
            <p className="font-medium">Invalid Credentials</p>
            <p className="mt-1 text-destructive/80">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Field
            label="Business Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="admin@yourbusiness.org"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Log In
          </button>
        </form>

        <div className="mt-6 flex justify-between text-xs">
          <Link to="/forgot-password" className="text-foreground hover:underline">
            Forgot Password?
          </Link>
          <Link to="/register" className="text-foreground hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}

export function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </label>
  );
}
