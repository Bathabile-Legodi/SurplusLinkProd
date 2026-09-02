import { useEffect, useState, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  role: "donor" | "ngo" | null;
  displayName: string;
  initials: string;
  isLoading: boolean;
}

/** Resolve a human-readable display name from Supabase user metadata. */
function resolveDisplayName(user: User | null): string {
  if (!user) return "User";
  const m = user.user_metadata ?? {};
  return (
    m.business_name ||
    m.organization_name ||
    m.full_name ||
    m.name ||
    user.email?.split("@")[0] ||
    "User"
  );
}

function resolveInitials(name: string): string {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0][0].toUpperCase();
}

/**
 * Central reactive auth hook.
 * - Reacts to login/logout in any tab via onAuthStateChange.
 * - Provides a signOut() helper that ends the Supabase session then
 *   navigates to /login.
 * - Exposes displayName and initials derived from user_metadata.
 */
export function useAuth(requiredRole?: "donor" | "ngo") {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    displayName: "User",
    initials: "US",
    isLoading: true,
  });

  useEffect(() => {
    // Get the current session immediately on mount.
    supabase.auth.getUser().then(({ data: { user } }) => {
      const displayName = resolveDisplayName(user);
      setState({
        user,
        role: (user?.user_metadata?.role as "donor" | "ngo") ?? null,
        displayName,
        initials: resolveInitials(displayName),
        isLoading: false,
      });
    });

    // Stay in sync with auth changes across tabs/windows.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      const displayName = resolveDisplayName(user);
      setState({
        user,
        role: (user?.user_metadata?.role as "donor" | "ngo") ?? null,
        displayName,
        initials: resolveInitials(displayName),
        isLoading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!state.isLoading) {
      const pathname = router.state.location.pathname;
      const inferredRole = pathname.startsWith("/donor") ? "donor" : pathname.startsWith("/ngo") ? "ngo" : undefined;
      const effectiveRequiredRole = requiredRole || inferredRole;
      
      // Determine if the current route requires authentication
      const isProtectedRoute = !!effectiveRequiredRole;

      if (isProtectedRoute) {
        if (!state.user) {
          // Not logged in but accessing a protected route
          router.navigate({ to: "/login" });
        } else if (effectiveRequiredRole && state.role !== effectiveRequiredRole) {
          // Logged in but wrong role
          router.navigate({ to: "/login" });
        }
      }
    }
  }, [state.isLoading, state.user, state.role, requiredRole, router]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // Clear cookies manually as a fallback just in case supabase.auth.signOut doesn't clear SSR cookies properly
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      // Force navigation
      window.location.href = "/login";
    }
  }, [router]);

  return { ...state, signOut };
}

