import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createSupabaseServerClient } from "./supabase-server";

/**
 * Server function to securely retrieve the current user from cookies.
 * During SSR, this runs directly on the server. During CSR, it acts as an RPC.
 */
export const getSessionServer = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { user };
});

/**
 * Use inside a route's `beforeLoad` to enforce a specific role.
 * Throws a redirect to /login if the user is unauthenticated or has a
 * different role. Returns { user, role } on success.
 */
export async function requireRole(required: "donor" | "ngo") {
  const { user } = await getSessionServer();

  if (!user) {
    throw redirect({ to: "/login" });
  }

  const role = user.user_metadata?.role as string | undefined;

  if (role !== required) {
    throw redirect({ to: "/login" });
  }

  return { user, role };
}

/**
 * Use inside a route's `beforeLoad` to enforce any authenticated session
 * without caring about role (e.g. shared pages).
 */
export async function requireAuth() {
  const { user } = await getSessionServer();

  if (!user) {
    throw redirect({ to: "/login" });
  }

  return { user, role: user.user_metadata?.role as "donor" | "ngo" | undefined };
}

/**
 * Use inside /login and /register `beforeLoad` to redirect already-authenticated
 * users straight to their dashboard.
 */
export async function redirectIfAuthenticated() {
  const { user } = await getSessionServer();

  if (!user) return; // Not logged in — allow through.

  const role = user.user_metadata?.role as string | undefined;
  if (role === "donor") throw redirect({ to: "/donor/dashboard" });
  if (role === "ngo") throw redirect({ to: "/ngo/dashboard" });
}
