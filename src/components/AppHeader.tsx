import { Link, useRouter } from "@tanstack/react-router";

type NavItem = { to: string; label: string };

interface AppHeaderProps {
  nav?: NavItem[];
  userLabel?: string;
}

export function AppHeader({ nav = [], userLabel = "JD" }: AppHeaderProps) {
  const router = useRouter();
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="font-semibold tracking-tight text-foreground">
          SurplusLink
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeProps={{ className: "text-foreground font-medium" }}
              className="hover:text-foreground transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.navigate({ to: "/" })}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Logout
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {userLabel}
          </div>
        </div>
      </div>
    </header>
  );
}

export const donorNav: NavItem[] = [
  { to: "/donor/dashboard", label: "Dashboard" },
  { to: "/donor/dashboard", label: "New Donation" },
  { to: "/donor/dashboard", label: "History" },
];

export const ngoNav: NavItem[] = [
  { to: "/ngo/dashboard", label: "Dashboard" },
  { to: "/ngo/explore", label: "Explore Donations" },
  { to: "/ngo/claims", label: "My Claims" },
  { to: "/ngo/claims", label: "Profile" },
];
