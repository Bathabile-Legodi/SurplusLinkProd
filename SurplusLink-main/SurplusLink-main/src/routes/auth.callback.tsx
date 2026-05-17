import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleSessionVerification() {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.error("Verification error or session missing:", error);
        navigate({ to: "/login" });
        return;
      }

      
      const userRole = session.user.user_metadata?.role;

      
      if (userRole === "donor") {
        navigate({ to: "/donor/dashboard" });
      } else if (userRole === "ngo") {
        navigate({ to: "/ngo/dashboard" });
      } else {
        console.warn("User role not recognized, defaulting to home");
        navigate({ to: "/" });
      }
    }

    handleSessionVerification();
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="text-sm font-medium text-muted-foreground">
          Verifying your account and preparing your dashboard...
        </p>
      </div>
    </main>
  );
}