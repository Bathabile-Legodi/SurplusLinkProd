import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Field } from "./index";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<"donor" | "ngo">("donor");

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    const userRole = data.user.user_metadata.role;

    // prevents NGO logging into donor section and vice versa
    if (userRole !== tab) {
      await supabase.auth.signOut();

      alert(
        `This account belongs to a ${userRole.toUpperCase()}`
      );

      return;
    }

    // redirect based on selected role
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
            onChange={(v) =>
            setForm({
                ...form,
                email: v,
            })
            }
            placeholder="you@example.com"
        />

        <div>
            <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) =>
                setForm({
                ...form,
                password: v,
                })
            }
            placeholder="••••••••"
            />
           
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