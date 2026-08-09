import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Menu, X, User, HeartHandshake, Settings, LogOut, Moon, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePushSubscription } from "@/hooks/usePushSubscription";

type NavItem = { to: string; label: string };

interface AppHeaderProps {
  nav?: NavItem[];
  userLabel?: string;
}

export function AppHeader({ nav = [] }: AppHeaderProps) {
  const { signOut, displayName, role, initials } = useAuth();
  const { isSubscribed, toggleSubscription, loading: pushLoading } = usePushSubscription();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          
          {/* Avatar Dropdown Container */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground hover:ring-2 hover:ring-primary/30 transition-all focus:outline-none"
            >
              {initials}
            </button>

            {/* Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-popover border border-border p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 z-50">
                {/* Profile Header Block */}
                <div className="flex flex-col items-center justify-center py-5 px-4 pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg mb-3">
                    {initials}
                  </div>
                  <h3 className="text-[15px] font-semibold text-popover-foreground tracking-tight">{displayName}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {role === 'ngo' ? 'NGO' : role === 'donor' ? 'Donor' : 'User'} Account
                  </p>
                </div>

                <div className="h-px bg-border mx-2 mb-1.5"></div>

                {/* Menu Items */}
                <div className="flex flex-col gap-0.5">
                  <Link
                    to={role === "donor" ? "/donor/profile" : "/ngo/profile"}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-muted"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>

                  {role === "donor" && (
                    <Link
                      to="/donor/funds"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-muted"
                    >
                      <HeartHandshake className="h-4 w-4" />
                      Fund NGOs
                    </Link>
                  )}

                  <div className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted">
                    <div className="flex items-center gap-3 text-sm text-primary">
                      <Bell className="h-4 w-4" />
                      Notifications
                    </div>
                    <button 
                      onClick={toggleSubscription}
                      disabled={pushLoading}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/75 ${isSubscribed ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                      <span className="sr-only">Toggle notifications</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-sm ring-0 transition duration-200 ease-in-out ${isSubscribed ? 'translate-x-4' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-muted text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>

                {/* Footer Links */}
                <div className="mt-3 mb-2 flex justify-center gap-2 text-[10px] text-muted-foreground">
                  <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                  <span>·</span>
                  <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
                </div>
              </div>
            )}
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

