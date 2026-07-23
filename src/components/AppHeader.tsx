import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";

type NavItem = { to: string; label: string };

interface AppHeaderProps {
  nav?: NavItem[];
  userLabel?: string;
}

export function AppHeader({ nav = [], userLabel = "JD" }: AppHeaderProps) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="font-semibold tracking-tight text-foreground shrink-0">
          SurplusLink
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`transition-colors hover:text-foreground ${
                pathname.startsWith(n.to) ? "font-medium text-foreground" : ""
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logout — always visible */}
          <button
            onClick={() => router.navigate({ to: "/" })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Logout
          </button>

          {/* Avatar — always visible */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {userLabel}
          </div>

          {/* Hamburger — mobile only */}
          {nav.length > 0 && (
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
              className="md:hidden flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {open && nav.length > 0 && (
        <div className="border-t bg-card px-4 pb-4 pt-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  pathname.startsWith(n.to)
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export const donorNav: NavItem[] = [
  { to: "/donor/dashboard", label: "Dashboard" },
  { to: "/donor/history", label: "History" },
  { to: "/donor/impact", label: "Impact & Records" },
  { to: "/donor/network", label: "Community Network" },
];

export const ngoNav: NavItem[] = [
  { to: "/ngo/dashboard", label: "Dashboard" },
  { to: "/ngo/explore", label: "Explore Donations" },
  { to: "/ngo/claims", label: "My Claims" },
];
