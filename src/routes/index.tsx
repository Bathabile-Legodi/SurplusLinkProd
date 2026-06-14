import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cullinan Golf Club — Play Where Diamonds Were Found" },
      {
        name: "description",
        content:
          "An 18-hole championship course set in the historic diamond town of Cullinan, Pretoria. Memberships, bookings, functions and a fully stocked golf shop.",
      },
      { property: "og:title", content: "Cullinan Golf Club" },
      {
        property: "og:description",
        content:
          "Play the picturesque 18-hole course in Cullinan, Pretoria. Book a tee time, host an event or join the club.",
      },
      {
        property: "og:image",
        content:
          "https://static.wixstatic.com/media/a90439_48ea5a0397074de0886915627ac159be~mv2.jpg/v1/fill/w_1905,h_1080,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/a90439_48ea5a0397074de0886915627ac159be~mv2.jpg",
      },
    ],
  }),
  component: HomePage,
});

const HERO =
  "https://static.wixstatic.com/media/a90439_48ea5a0397074de0886915627ac159be~mv2.jpg/v1/fill/w_1905,h_1080,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/a90439_48ea5a0397074de0886915627ac159be~mv2.jpg";
const COURSE_MAP =
  "https://static.wixstatic.com/media/a90439_3076e6e9071e4c9ca0daf416264a7685~mv2.png/v1/fill/w_735,h_714,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/CGC%20Combined%20V2.png";
const GREEN_PHOTO =
  "https://images.unsplash.com/photo-1587381420270-3e1a5b9e6904?auto=format&fit=crop&w=1600&q=80";
const CLUB_PHOTO =
  "https://images.unsplash.com/photo-1535132011086-b8818f016104?auto=format&fit=crop&w=1600&q=80";
const FAIRWAY_PHOTO =
  "https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1600&q=80";

const NAV = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#course", label: "Course" },
  { href: "#specials", label: "Specials" },
  { href: "#functions", label: "Functions" },
  { href: "#contact", label: "Contact" },
];

function HomePage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-[#1c2b1f]">
      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[#0f2417]/85 backdrop-blur supports-[backdrop-filter]:bg-[#0f2417]/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#home" className="flex items-center gap-2 text-[#f3e9c8]">
            <DiamondIcon />
            <span className="font-serif text-lg tracking-wide">Cullinan Golf Club</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-[#f3e9c8]/90 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition hover:text-[#f3e9c8]">
                {n.label}
              </a>
            ))}
            <a
              href="#bookings"
              className="rounded-full bg-[#f3e9c8] px-4 py-1.5 text-[#0f2417] font-medium transition hover:bg-white"
            >
              Book a Tee Time
            </a>
          </nav>
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-[#f3e9c8] md:hidden"
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6l-12 12" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>
        </div>
        {open && (
          <div className="border-t border-white/10 bg-[#0f2417] px-5 py-3 md:hidden">
            <nav className="flex flex-col gap-3 text-sm text-[#f3e9c8]">
              {NAV.map((n) => (
                <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
                  {n.label}
                </a>
              ))}
              <a href="#bookings" onClick={() => setOpen(false)} className="font-semibold">
                Book a Tee Time →
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="relative h-[100vh] min-h-[640px] w-full overflow-hidden">
        <img src={HERO} alt="Cullinan Golf Club fairway" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2417]/70 via-[#0f2417]/35 to-[#0f2417]/85" />
        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center text-[#f3e9c8]">
          <span className="mb-5 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#f3e9c8]/80">
            <span className="h-px w-8 bg-[#f3e9c8]/60" />
            Est. Cullinan, Pretoria
            <span className="h-px w-8 bg-[#f3e9c8]/60" />
          </span>
          <h1 className="font-serif text-5xl leading-tight md:text-7xl">
            Play where <em className="italic text-white">diamonds</em> were found.
          </h1>
          <p className="mt-6 max-w-xl text-base text-[#f3e9c8]/85 md:text-lg">
            An 18-hole championship course winding through indigenous bushveld in the historic
            diamond town of Cullinan.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#bookings"
              className="rounded-full bg-[#f3e9c8] px-7 py-3 text-sm font-semibold text-[#0f2417] transition hover:scale-[1.03] hover:bg-white"
            >
              Book a Tee Time
            </a>
            <a
              href="#course"
              className="rounded-full border border-[#f3e9c8]/60 px-7 py-3 text-sm font-medium text-[#f3e9c8] transition hover:bg-[#f3e9c8]/10"
            >
              Explore the Course
            </a>
          </div>
        </div>
        <a
          href="#about"
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-xs uppercase tracking-widest text-[#f3e9c8]/80"
        >
          Scroll ↓
        </a>
      </section>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#5a6b4f]">About the Club</p>
            <h2 className="mt-3 font-serif text-4xl text-[#1c2b1f] md:text-5xl">
              A round shaped by history and bushveld.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[#3a4a3a]">
              Cullinan Golf Club sits in the town that gave the world its largest diamond. Our
              18-hole course rolls through mature trees, dam-side fairways and quiet greens — a
              setting that feels a world away, just 30 minutes from Pretoria.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[#3a4a3a]">
              Whether you're a member, a visiting four-ball or hosting a corporate day, you'll find
              a warm clubhouse, a friendly halfway house, and one of the most picturesque tracks in
              Gauteng.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <Stat n="18" l="Holes" />
              <Stat n="72" l="Par" />
              <Stat n="6.2km" l="Course Length" />
            </div>
          </div>
          <div className="relative">
            <img
              src={GREEN_PHOTO}
              alt="Manicured green"
              className="aspect-[4/5] w-full rounded-lg object-cover shadow-xl"
            />
            <div className="absolute -bottom-6 -left-6 hidden h-32 w-32 rotate-12 items-center justify-center rounded-lg bg-[#0f2417] text-[#f3e9c8] shadow-xl md:flex">
              <div className="text-center">
                <p className="font-serif text-3xl">Est.</p>
                <p className="text-xs uppercase tracking-widest">1973</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COURSE */}
      <section id="course" className="bg-[#0f2417] py-24 text-[#f3e9c8]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-[#f3e9c8]/60">The Course</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">A layout to fall for.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[#f3e9c8]/75">
              18 distinct holes — water in play on five, signature dog-legs through the bushveld
              and greens that reward patience.
            </p>
          </div>
          <div className="grid items-center gap-10 md:grid-cols-5">
            <div className="md:col-span-3 rounded-lg bg-[#f3e9c8]/5 p-6 ring-1 ring-[#f3e9c8]/15">
              <img src={COURSE_MAP} alt="Cullinan course layout map" className="mx-auto max-h-[520px] w-auto" />
            </div>
            <ul className="space-y-5 md:col-span-2">
              <Feature
                title="Front Nine"
                body="Tight, tree-lined fairways set the tone — accuracy over distance off the tee."
              />
              <Feature
                title="Signature 7th"
                body="Approach over water to a tilting green framed by giant blue gums."
              />
              <Feature
                title="Back Nine"
                body="Opens into wider corridors with elevation changes and reachable par-fives."
              />
              <Feature
                title="Practice Facilities"
                body="Driving range, chipping green and a putting lawn beside the clubhouse."
              />
            </ul>
          </div>
        </div>
      </section>

      {/* SPECIALS / BOOKINGS */}
      <section id="specials" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#5a6b4f]">Specials</p>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl">Tee-time offers this week.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Special
            tag="Weekday"
            title="Two-Ball Special"
            price="R 690"
            lines={["18 holes for two players", "Shared cart included", "Mon–Thu, before 11:00"]}
          />
          <Special
            featured
            tag="Most Popular"
            title="Four-Ball Friday"
            price="R 1 480"
            lines={["18 holes for four players", "Halfway-house voucher", "Bookings 06:30–13:00"]}
          />
          <Special
            tag="Sunset"
            title="Twilight Round"
            price="R 240"
            lines={["9 holes after 16:00", "Walk or cart (extra)", "Daily, weather permitting"]}
          />
        </div>
        <div id="bookings" className="mt-14 rounded-2xl bg-[#0f2417] p-10 text-[#f3e9c8]">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h3 className="font-serif text-2xl md:text-3xl">Reserve your tee time</h3>
              <p className="mt-2 text-[#f3e9c8]/75">Call the pro-shop or email to confirm your slot.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="tel:+27127340090" className="rounded-full bg-[#f3e9c8] px-6 py-3 text-sm font-semibold text-[#0f2417] hover:bg-white">
                Call 012 734 0090
              </a>
              <a
                href="mailto:cullinangolfclub@worldonline.co.za"
                className="rounded-full border border-[#f3e9c8]/50 px-6 py-3 text-sm font-medium hover:bg-[#f3e9c8]/10"
              >
                Email the Pro Shop
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FUNCTIONS */}
      <section id="functions" className="bg-[#eee7d2]/60 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
          <img src={CLUB_PHOTO} alt="Clubhouse interior" className="aspect-[4/3] w-full rounded-lg object-cover shadow-xl" />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#5a6b4f]">Functions & Events</p>
            <h2 className="mt-3 font-serif text-4xl text-[#1c2b1f] md:text-5xl">
              Weddings, corporate days, celebrations.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[#3a4a3a]">
              Our clubhouse and patio overlook the 18th green — a relaxed, beautiful setting for
              everything from intimate dinners to full corporate golf days for up to 120 guests.
            </p>
            <ul className="mt-6 space-y-2 text-[#3a4a3a]">
              <Bullet>Full-day corporate golf packages</Bullet>
              <Bullet>Wedding receptions on the patio</Bullet>
              <Bullet>Year-end and birthday functions</Bullet>
              <Bullet>In-house catering and bar</Bullet>
            </ul>
            <a
              href="#contact"
              className="mt-8 inline-flex rounded-full bg-[#0f2417] px-7 py-3 text-sm font-semibold text-[#f3e9c8] transition hover:bg-[#1c4028]"
            >
              Enquire about a function
            </a>
          </div>
        </div>
      </section>

      {/* GALLERY STRIP */}
      <section className="grid grid-cols-2 md:grid-cols-4">
        {[HERO, FAIRWAY_PHOTO, GREEN_PHOTO, CLUB_PHOTO].map((src, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden">
            <img src={src} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
          </div>
        ))}
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-[#0f2417] py-24 text-[#f3e9c8]">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#f3e9c8]/60">Visit Us</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">Contact & directions.</h2>
            <dl className="mt-8 space-y-5 text-[#f3e9c8]/90">
              <Info label="Address" value={["Main Street, Cullinan", "Pretoria, South Africa, 1000"]} />
              <Info label="Telephone" value={["012 734 0090"]} />
              <Info label="Email" value={["cullinangolfclub@worldonline.co.za"]} />
              <Info
                label="Opening Hours"
                value={["Mon – Fri: 06:30 – 18:00", "Sat – Sun: 06:00 – 19:00"]}
              />
            </dl>
          </div>
          <div className="overflow-hidden rounded-lg ring-1 ring-[#f3e9c8]/15">
            <iframe
              title="Cullinan Golf Club location"
              src="https://www.google.com/maps?q=Cullinan+Golf+Club&output=embed"
              className="h-full min-h-[360px] w-full"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#08170e] py-8 text-center text-xs text-[#f3e9c8]/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6">
          <div className="flex items-center gap-2 text-[#f3e9c8]">
            <DiamondIcon />
            <span className="font-serif tracking-wide">Cullinan Golf Club</span>
          </div>
          <p>© {new Date().getFullYear()} Cullinan Golf Club. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-lg border border-[#1c2b1f]/10 bg-white py-4">
      <p className="font-serif text-2xl text-[#0f2417]">{n}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-[#5a6b4f]">{l}</p>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <li className="border-l-2 border-[#f3e9c8]/30 pl-4">
      <p className="font-serif text-lg text-[#f3e9c8]">{title}</p>
      <p className="mt-1 text-sm text-[#f3e9c8]/70">{body}</p>
    </li>
  );
}

function Special({
  tag, title, price, lines, featured,
}: { tag: string; title: string; price: string; lines: string[]; featured?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-7 transition hover:-translate-y-1 ${
        featured
          ? "border-[#0f2417] bg-[#0f2417] text-[#f3e9c8] shadow-xl"
          : "border-[#1c2b1f]/10 bg-white text-[#1c2b1f]"
      }`}
    >
      <p className={`text-xs uppercase tracking-widest ${featured ? "text-[#f3e9c8]/70" : "text-[#5a6b4f]"}`}>
        {tag}
      </p>
      <h3 className="mt-2 font-serif text-2xl">{title}</h3>
      <p className="mt-4 font-serif text-4xl">{price}</p>
      <ul className={`mt-5 space-y-2 text-sm ${featured ? "text-[#f3e9c8]/85" : "text-[#3a4a3a]"}`}>
        {lines.map((l) => (
          <li key={l}>• {l}</li>
        ))}
      </ul>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 inline-block h-1.5 w-1.5 rotate-45 bg-[#0f2417]" />
      <span>{children}</span>
    </li>
  );
}

function Info({ label, value }: { label: string; value: string[] }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-[#f3e9c8]/55">{label}</dt>
      {value.map((v) => (
        <dd key={v} className="font-serif text-lg leading-snug">{v}</dd>
      ))}
    </div>
  );
}

function DiamondIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 3h12l3 6-9 12L3 9z" />
      <path d="M3 9h18M9 3l3 6 3-6M12 9l-3 12M12 9l3 12" />
    </svg>
  );
}
