import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { redirectIfAuthenticated } from "@/lib/auth-guard";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const Route = createFileRoute("/login")({
  beforeLoad: () => redirectIfAuthenticated(),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<"donor" | "ngo">("donor");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function handleLogin(data: LoginForm) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes("invalid login") ||
        msg.includes("invalid credentials") ||
        msg.includes("wrong") ||
        msg.includes("password")
      ) {
        setError("password", { message: "Incorrect email or password." });
      } else if (msg.includes("email")) {
        setError("email", { message: error.message });
      } else {
        toast.error(error.message);
      }
      return;
    }

    // Navigate based on role stored in metadata — ignore the UI tab selection.
    const userRole = authData.user.user_metadata?.role as string | undefined;
    toast.success("Successfully logged in!");
    if (userRole === "ngo") {
      navigate({ to: "/ngo/dashboard" });
    } else {
      navigate({ to: "/donor/dashboard" });
    }
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

        <form onSubmit={handleSubmit(handleLogin)} noValidate className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-foreground">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors ${
                errors.email
                  ? "border-destructive focus:ring-destructive focus:border-destructive"
                  : "border-input focus:border-ring focus:ring-ring"
              }`}
            />
            {errors.email && (
              <p className="text-[11px] text-destructive leading-tight">{errors.email.message}</p>
            )}
          </div>

          {/* Password with show/hide toggle */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground">Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className={`w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors
                  ${errors.password
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
            {errors.password && (
              <p className="text-[11px] text-destructive leading-tight">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Logging in…" : tab === "donor" ? "Login as Donor" : "Login as NGO"}
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