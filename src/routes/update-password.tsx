import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const Route = createFileRoute("/update-password")({
  head: () => ({
    meta: [{ title: "Update Password — SurplusLink" }],
  }),
  component: UpdatePassword,
});

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;

function UpdatePassword() {
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    // Check URL hash for direct Supabase recovery errors (e.g., expired token)
    const hash = window.location.hash;
    if (hash.includes("error_description=")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const description = params.get("error_description");
      if (description) {
        setErrorMsg(decodeURIComponent(description.replace(/\+/g, " ")));
      }
    }
  }, []);

  async function handleUpdatePassword(data: UpdatePasswordForm) {
    setErrorMsg("");
    setSuccessMsg("");

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // 3. Clear session and notify user
    setSuccessMsg("Password updated successfully in Supabase! Redirecting to login...");
    
    setTimeout(async () => {
      await supabase.auth.signOut();
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

        <form onSubmit={handleSubmit(handleUpdatePassword)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              New Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className={`w-full rounded-md border bg-background p-2 text-sm outline-none focus:ring-1 transition-colors ${
                errors.password
                  ? "border-destructive focus:ring-destructive focus:border-destructive"
                  : "border-input focus:border-ring focus:ring-ring"
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-[11px] text-destructive leading-tight">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              className={`w-full rounded-md border bg-background p-2 text-sm outline-none focus:ring-1 transition-colors ${
                errors.confirmPassword
                  ? "border-destructive focus:ring-destructive focus:border-destructive"
                  : "border-input focus:border-ring focus:ring-ring"
              }`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-[11px] text-destructive leading-tight">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Updating in Supabase..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}