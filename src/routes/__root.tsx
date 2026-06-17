import { Outlet, Link, createRootRoute, HeadContent, Scripts, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";

import appCss from "../styles.css?url";

function isProtectedPath(pathname: string) {
  return pathname.startsWith("/donor") || pathname.startsWith("/ngo");
}

async function enforceProtectedRoutes(pathname: string) {
  if (typeof window === "undefined" || !isProtectedPath(pathname)) {
    return;
  }

  const { data } = await supabase.auth.getSession();
  const role = data.session?.user.user_metadata?.role;

  if (!role) {
    throw redirect({ to: "/" });
  }

  if (pathname.startsWith("/donor") && role !== "donor") {
    throw redirect({ to: role === "ngo" ? "/ngo/dashboard" : "/" });
  }

  if (pathname.startsWith("/ngo") && role !== "ngo") {
    throw redirect({ to: role === "donor" ? "/donor/dashboard" : "/" });
  }
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    await enforceProtectedRoutes(location.pathname);
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SurplusLink" },
      { name: "description", content: "Connect surplus food with verified NGOs. Reduce waste, feed communities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
