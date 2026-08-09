import { redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

/**
 * Use inside a route's `beforeLoad` to enforce a specific role.
 * Throws a redirect to /login if the user is unauthenticated or has a
 * different role. Returns { user, role } on success.
 */
export async function requireRole(required: "donor" | "ngo") {
  if (typeof document === "undefined") return { user: null, role: required };

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw redirect({ to: "/login" });
  }

  const role = user.user_metadata?.role as string | undefined;

  if (role !== required) {
    // Authenticated but wrong role — send back to login so they can
    // switch accounts rather than silently failing later.
    throw redirect({ to: "/login" });
  }

  return { user, role };
}

/**
 * Use inside a route's `beforeLoad` to enforce any authenticated session
 * without caring about role (e.g. shared pages).
 */
export async function requireAuth() {
  if (typeof document === "undefined") return { user: null, role: undefined };

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw redirect({ to: "/login" });
  }

  return { user, role: user.user_metadata?.role as "donor" | "ngo" | undefined };
}

/**
 * Use inside /login and /register `beforeLoad` to redirect already-authenticated
 * users straight to their dashboard.
 */
export async function redirectIfAuthenticated() {
  if (typeof document === "undefined") return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return; // Not logged in — allow through.

  const role = user.user_metadata?.role as string | undefined;
  if (role === "donor") throw redirect({ to: "/donor/dashboard" });
  if (role === "ngo") throw redirect({ to: "/ngo/dashboard" });
}
