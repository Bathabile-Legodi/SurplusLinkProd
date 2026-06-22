import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Camera,
  Radio,
  Truck,
  MapPin,
  Bell,
  PackageCheck,
  ShieldCheck,
  BadgeCheck,
  ClipboardCheck,
  Search,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SurplusLink — Connecting Excess to Impact" },
      {
        name: "description",
        content:
          "SurplusLink is the real-time bridge between food donors and vetted NGOs. Rescue edible surplus food before it goes to waste.",
      },
      { property: "og:title", content: "SurplusLink — Connecting Excess to Impact" },
      {
        property: "og:description",
        content:
          "An instant communication channel between food donors and NGOs. Post surplus, get matched, rescue meals.",
      },
    ],
  }),
  component: Landing,
});

function smoothScroll(id: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
}

function Nav() {
  const [open, setOpen] = useState(false);
  const links = [
    { id: "how", label: "How It Works" },
    { id: "donors", label: "For Donors" },
    { id: "ngos", label: "For NGOs" },
    { id: "live", label: "Live Alerts" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#top" onClick={smoothScroll("top")} className="text-xl font-black tracking-tight">
          Surplus<span className="text-neutral-400">·</span>Link
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={smoothScroll(l.id)}
              className="text-sm font-medium text-neutral-700 transition-colors hover:text-black"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="h-10 rounded-full border border-black bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="group h-10 rounded-full border border-black bg-black px-5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-black"
          >
            Register as Donor / NGO
          </Link>
        </div>
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <div className="space-y-1.5">
            <span className="block h-0.5 w-6 bg-black" />
            <span className="block h-0.5 w-6 bg-black" />
            <span className="block h-0.5 w-6 bg-black" />
          </div>
        </button>
      </div>
      {open && (
        <div className="border-t border-black/10 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={(e) => {
                  smoothScroll(l.id)(e);
                  setOpen(false);
                }}
                className="text-sm font-medium text-neutral-700"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/login"
              className="mt-2 h-10 rounded-full border border-black bg-white px-5 text-sm font-semibold text-black"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="h-10 rounded-full bg-black px-5 text-sm font-semibold text-white"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-black/10 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-36">
        <div className="grid items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-3 py-1 text-xs font-medium uppercase tracking-widest text-neutral-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" />
              Live network · responding now
            </div>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Connecting<br />
              Excess to<br />
              <span className="italic font-serif">Impact.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-neutral-600">
              SurplusLink is the instant communication channel that bridges the gap between food
              donors and NGOs in real time — rescuing surplus food before it goes to waste.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-full border border-black bg-black px-8 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-black"
              >
                Post Available Food (Donors)
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/register"
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-full border border-black bg-white px-8 text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white"
              >
                Request Food Alerts (NGOs)
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl border border-black/10" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-900 text-white">
                <div className="absolute inset-0 grid place-items-center opacity-[0.08]">
                  <div className="text-[20rem] font-black leading-none">SL</div>
                </div>
                <div className="relative flex h-full flex-col justify-between p-8">
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest text-neutral-400">
                    <span>Live Match</span>
                    <span>00:42</span>
                  </div>
                  <div className="space-y-4">
                    <div className="text-xs uppercase tracking-widest text-neutral-400">
                      Matched
                    </div>
                    <div className="text-3xl font-bold leading-tight">
                      120kg fresh produce<br />
                      <span className="text-neutral-400">→ Hope Kitchen NGO</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-300">
                      <MapPin className="h-4 w-4" />
                      Pickup in 18 min · 2.4km away
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    { value: "2,480,000", label: "Meals Rescued" },
    { value: "640+", label: "Vetted NGOs Connected" },
    { value: "1,200 Tons", label: "CO₂ Emissions Prevented" },
    { value: "Real-Time", label: "Average Match Speed" },
  ];
  return (
    <section className="border-b border-black/10 bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-4">
          {items.map((s) => (
            <div key={s.label} className="border-l border-white/15 pl-6">
              <div className="text-4xl font-black tracking-tight md:text-5xl">{s.value}</div>
              <div className="mt-3 text-xs uppercase tracking-widest text-neutral-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const donorSteps = [
    { icon: Camera, title: "Snap a photo & list details", desc: "Quantity, category, pickup window." },
    { icon: Radio, title: "Broadcast instant alert", desc: "Nearby vetted NGOs are notified in seconds." },
    { icon: Truck, title: "Vetted NGO collects", desc: "Tracked pickup, signed handover, done." },
  ];
  const ngoSteps = [
    { icon: MapPin, title: "Set location preferences", desc: "Radius, categories, capacity." },
    { icon: Bell, title: "Get instant match notifications", desc: "Push alerts the moment surplus appears." },
    { icon: PackageCheck, title: "Collect and distribute", desc: "Confirm collection, report impact." },
  ];
  return (
    <section id="how" className="border-b border-black/10 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 max-w-2xl">
          <div className="text-xs font-medium uppercase tracking-widest text-neutral-500">
            How it works
          </div>
          <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Two sides. One urgent loop.
          </h2>
        </div>

        <div className="grid gap-0 md:grid-cols-2">
          <Column id="donors" label="For Donors" heading="Have Surplus Food?" steps={donorSteps} />
          <div className="border-t border-black/10 md:border-l md:border-t-0">
            <Column id="ngos" label="For NGOs" heading="Need Supply?" steps={ngoSteps} dark />
          </div>
        </div>
      </div>
    </section>
  );
}

function Column({
  id,
  label,
  heading,
  steps,
  dark,
}: {
  id: string;
  label: string;
  heading: string;
  steps: { icon: React.ElementType; title: string; desc: string }[];
  dark?: boolean;
}) {
  return (
    <div
      id={id}
      className={`p-10 md:p-12 ${dark ? "bg-neutral-950 text-white" : "bg-white text-black"}`}
    >
      <div
        className={`text-xs font-medium uppercase tracking-widest ${dark ? "text-neutral-400" : "text-neutral-500"}`}
      >
        {label}
      </div>
      <h3 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">{heading}</h3>
      <ol className="mt-10 space-y-8">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${dark ? "border-white/30" : "border-black/20"}`}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div
                className={`text-xs uppercase tracking-widest ${dark ? "text-neutral-500" : "text-neutral-400"}`}
              >
                Step 0{i + 1}
              </div>
              <div className="mt-1 text-lg font-bold">{s.title}</div>
              <div
                className={`mt-1 text-sm ${dark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                {s.desc}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

type Alert = {
  time: string;
  item: string;
  loc: string;
  status: "Claimed" | "Available";
  by?: string;
  dist?: string;
};

const ALERTS: Alert[] = [
  { time: "12:04", item: "200kg Fresh Vegetables", loc: "Cape Town · CBD", status: "Claimed", by: "Hope Kitchen" },
  { time: "11:51", item: "80 Bakery Loaves", loc: "Sea Point", status: "Available", dist: "5km away" },
  { time: "11:32", item: "45L Dairy (Sealed)", loc: "Woodstock", status: "Claimed", by: "Sunrise Shelter" },
  { time: "11:14", item: "12 Cases Canned Goods", loc: "Salt River", status: "Available", dist: "3km away" },
  { time: "10:58", item: "30kg Cooked Meals", loc: "Observatory", status: "Claimed", by: "Open Table NGO" },
  { time: "10:42", item: "150kg Mixed Produce", loc: "Bellville", status: "Available", dist: "11km away" },
];

function LiveFeed() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <section id="live" className="border-b border-black/10 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <div className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              Live activity feed
            </div>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Food available <span className="italic font-serif">now.</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-black" />
            </span>
            <span className="text-xs font-medium uppercase tracking-widest text-neutral-700">
              {6 + (tick % 4)} active alerts
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white">
          <div className="grid gap-3 border-b border-black/10 p-4 md:grid-cols-[1fr_1fr_auto]">
            <div className="flex items-center gap-2 rounded-full border border-black/15 bg-white px-4">
              <Search className="h-4 w-4 text-neutral-500" />
              <input
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-neutral-500"
                placeholder="Location (e.g. Cape Town)"
              />
            </div>
            <div className="flex items-center gap-2 rounded-full border border-black/15 bg-white px-4">
              <MapPin className="h-4 w-4 text-neutral-500" />
              <input
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-neutral-500"
                placeholder="Food category (e.g. Produce, Bakery)"
              />
            </div>
            <button className="h-10 rounded-full border border-black bg-black px-6 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-black">
              Filter
            </button>
          </div>

          <div className="hidden grid-cols-[90px_1.5fr_1fr_1.2fr] gap-4 border-b border-black/10 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-500 md:grid">
            <div>Time</div>
            <div>Item</div>
            <div>Location</div>
            <div>Status</div>
          </div>

          <ul className="divide-y divide-black/10">
            {ALERTS.map((a, i) => (
              <li
                key={i}
                className="grid grid-cols-1 gap-2 px-6 py-5 transition-colors hover:bg-neutral-50 md:grid-cols-[90px_1.5fr_1fr_1.2fr] md:items-center md:gap-4"
              >
                <div className="flex items-center gap-2 text-sm font-mono text-neutral-600">
                  <Clock className="h-3.5 w-3.5" />
                  {a.time}
                </div>
                <div className="font-semibold">{a.item}</div>
                <div className="text-sm text-neutral-600">{a.loc}</div>
                <div>
                  {a.status === "Claimed" ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                      <BadgeCheck className="h-3 w-3" />
                      Claimed by {a.by}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-black px-3 py-1 text-xs font-medium text-black">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" />
                      Available · {a.dist}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const items = [
    { icon: ShieldCheck, title: "Vetted NGOs", desc: "Every NGO is fully registered and verified before joining the network." },
    { icon: ClipboardCheck, title: "Tracked Handovers", desc: "Signed pickup receipts and chain-of-custody for every donation." },
    { icon: BadgeCheck, title: "Regulatory Compliance", desc: "Aligned with food safety regulations and safe-handling guidelines." },
  ];
  return (
    <section className="border-b border-black/10 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              Trust & Compliance
            </div>
            <h2 className="mt-3 text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Safe, vetted, and secure asset tracking.
            </h2>
            <p className="mt-6 max-w-md text-neutral-600">
              We treat surplus food with the same rigor as any regulated supply chain — verified
              participants, traceable movement, and accountability at every step.
            </p>
          </div>
          <div className="md:col-span-7">
            <div className="grid gap-px overflow-hidden rounded-2xl bg-black/10 md:grid-cols-1">
              {items.map((it) => (
                <div key={it.title} className="flex gap-5 bg-white p-8">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/20">
                    <it.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-bold">{it.title}</div>
                    <div className="mt-1 text-sm text-neutral-600">{it.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
          The next meal is already on the shelf. <span className="italic font-serif text-neutral-400">Don't let it expire.</span>
        </h2>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="h-14 rounded-full border border-white bg-white px-8 text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white hover:border-white"
          >
            I'm a Donor
          </Link>
          <Link
            to="/register"
            className="h-14 rounded-full border border-white bg-transparent px-8 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-black"
          >
            I'm an NGO
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-black/10 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="text-xl font-black tracking-tight">Surplus·Link</div>
            <p className="mt-4 max-w-sm text-sm text-neutral-600">
              A real-time bridge between food donors and vetted NGOs. Built to move faster than
              waste.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-8 flex max-w-sm items-center gap-2 rounded-full border border-black p-1"
            >
              <input
                type="email"
                placeholder="Your email"
                className="h-10 w-full bg-transparent px-4 text-sm outline-none placeholder:text-neutral-500"
              />
              <button className="h-10 shrink-0 rounded-full bg-black px-5 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black hover:ring-1 hover:ring-black">
                Subscribe
              </button>
            </form>
          </div>
          <FooterCol
            title="Platform"
            links={["How It Works", "For Donors", "For NGOs", "Live Alerts"]}
          />
          <FooterCol title="Company" links={["About", "Impact Report", "Press", "Careers"]} />
          <FooterCol title="Contact" links={["hello@surpluslink.org", "+27 21 000 0000", "Cape Town, ZA"]} />
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-8 text-xs text-neutral-500 md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} SurplusLink. All rights reserved.</div>
          <div className="max-w-xl md:text-right">
            SurplusLink operates in accordance with national food safety and donation regulations.
            All NGO partners are independently verified.
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="md:col-span-2">
      <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
        {title}
      </div>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-sm text-neutral-800 hover:text-black hover:underline">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Landing() {
  return (
    <main className="min-h-screen scroll-smooth bg-white text-black antialiased">
      <Nav />
      <Hero />
      <Stats />
      <HowItWorks />
      <LiveFeed />
      <Trust />
      <CTA />
      <Footer />
    </main>
  );
}
