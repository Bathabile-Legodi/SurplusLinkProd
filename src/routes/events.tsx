import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events Calendar — Cullinan Golf Club" },
      {
        name: "description",
        content:
          "Tournaments, club days, social and corporate events at Cullinan Golf Club — view our upcoming calendar.",
      },
      { property: "og:title", content: "Events — Cullinan Golf Club" },
      {
        property: "og:description",
        content:
          "Browse our calendar of tournaments, member days, and special events at Cullinan Golf Club.",
      },
    ],
  }),
  component: EventsPage,
});

type ClubEvent = { date: string; title: string; time?: string; note?: string };

const STORAGE_KEY = "cgc.events.v1";

const SEED_EVENTS: ClubEvent[] = [
  { date: isoFromOffset(3), title: "Wednesday Affiliated Special", time: "07:30", note: "18 holes · R900" },
  { date: isoFromOffset(7), title: "Captain's Day", time: "11:00", note: "Members only · 4-ball alliance" },
  { date: isoFromOffset(14), title: "Sunday 4-Ball Open", time: "08:00", note: "Affiliated visitors · R1 900" },
];

function isoFromOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function EventsPage() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState<ClubEvent[]>(() => loadEvents());
  const [selected, setSelected] = useState<string>(isoFromOffset(0));
  const [draft, setDraft] = useState<{ title: string; time: string; note: string }>({
    title: "",
    time: "",
    note: "",
  });

  const monthLabel = cursor.toLocaleString("en", { month: "long", year: "numeric" });
  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);

  const eventsForSelected = events
    .filter((e) => e.date === selected)
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));

  const eventsByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of events) m.set(e.date, (m.get(e.date) ?? 0) + 1);
    return m;
  }, [events]);

  function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) return;
    const next = [...events, { date: selected, ...draft, title: draft.title.trim() }];
    setEvents(next);
    saveEvents(next);
    setDraft({ title: "", time: "", note: "" });
  }

  function removeEvent(index: number) {
    const target = eventsForSelected[index];
    const next = events.filter(
      (e) => !(e.date === target.date && e.title === target.title && e.time === target.time),
    );
    setEvents(next);
    saveEvents(next);
  }

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-[#1c2b1f]">
      <PageHeader />

      <section className="bg-[#0f2417] pt-28 pb-14 text-[#f3e9c8]">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-[#f3e9c8]/70">
            What's On
          </span>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl">Events Calendar</h1>
          <p className="mx-auto mt-5 max-w-2xl text-[#f3e9c8]/80">
            Pick a date to add tournaments, club days or social events to the calendar.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Calendar */}
          <div className="rounded-2xl border border-[#0f2417]/10 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <button
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                }
                className="rounded-full px-3 py-1.5 text-sm text-[#0f2417] transition hover:bg-[#0f2417]/5"
                aria-label="Previous month"
              >
                ← Prev
              </button>
              <h2 className="font-serif text-2xl">{monthLabel}</h2>
              <button
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                }
                className="rounded-full px-3 py-1.5 text-sm text-[#0f2417] transition hover:bg-[#0f2417]/5"
                aria-label="Next month"
              >
                Next →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-wider text-[#1c2b1f]/60">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {grid.map((cell, i) => {
                if (!cell) return <div key={i} className="aspect-square" />;
                const iso = cell.toISOString().slice(0, 10);
                const isToday = iso === isoFromOffset(0);
                const isSelected = iso === selected;
                const count = eventsByDay.get(iso) ?? 0;
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(iso)}
                    className={[
                      "aspect-square rounded-lg border p-1.5 text-left text-sm transition",
                      isSelected
                        ? "border-[#0f2417] bg-[#0f2417] text-[#f3e9c8]"
                        : "border-transparent hover:border-[#0f2417]/30 hover:bg-[#f3e9c8]/40",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${
                          isToday && !isSelected ? "text-[#0f2417]" : ""
                        }`}
                      >
                        {cell.getDate()}
                      </span>
                      {isToday && !isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0f2417]" />
                      )}
                    </div>
                    {count > 0 && (
                      <div
                        className={`mt-1 inline-block rounded-full px-1.5 text-[10px] font-semibold ${
                          isSelected
                            ? "bg-[#f3e9c8] text-[#0f2417]"
                            : "bg-[#0f2417] text-[#f3e9c8]"
                        }`}
                      >
                        {count} {count === 1 ? "event" : "events"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day panel */}
          <div className="rounded-2xl border border-[#0f2417]/10 bg-white p-6 shadow-sm">
            <h3 className="font-serif text-xl">
              {new Date(selected).toLocaleDateString("en", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h3>

            <ul className="mt-4 space-y-3">
              {eventsForSelected.length === 0 && (
                <li className="rounded-lg border border-dashed border-[#0f2417]/20 p-4 text-sm text-[#1c2b1f]/60">
                  No events on this date yet.
                </li>
              )}
              {eventsForSelected.map((e, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-lg border border-[#0f2417]/10 bg-[#f8f6f0] p-3"
                >
                  <div>
                    <div className="font-semibold">{e.title}</div>
                    {e.time && (
                      <div className="text-xs text-[#1c2b1f]/60">Tee off · {e.time}</div>
                    )}
                    {e.note && <div className="mt-1 text-sm text-[#1c2b1f]/75">{e.note}</div>}
                  </div>
                  <button
                    onClick={() => removeEvent(i)}
                    className="text-xs text-[#1c2b1f]/50 transition hover:text-red-600"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <form onSubmit={addEvent} className="mt-6 space-y-3 border-t border-[#0f2417]/10 pt-5">
              <div className="text-xs uppercase tracking-wider text-[#1c2b1f]/60">
                Add an event
              </div>
              <input
                value={draft.title}
                onChange={(ev) => setDraft({ ...draft, title: ev.target.value })}
                placeholder="Event title (e.g. Club Championship)"
                className="w-full rounded-md border border-[#0f2417]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#0f2417]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  value={draft.time}
                  onChange={(ev) => setDraft({ ...draft, time: ev.target.value })}
                  className="rounded-md border border-[#0f2417]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#0f2417]"
                />
                <input
                  value={draft.note}
                  onChange={(ev) => setDraft({ ...draft, note: ev.target.value })}
                  placeholder="Notes"
                  className="rounded-md border border-[#0f2417]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#0f2417]"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-[#0f2417] py-2.5 text-sm font-semibold text-[#f3e9c8] transition hover:bg-[#1c3a26]"
              >
                Add to {new Date(selected).toLocaleDateString("en", { day: "numeric", month: "short" })}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

function PageHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[#0f2417]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="font-serif text-lg tracking-wide text-[#f3e9c8]">
          ◆ Cullinan Golf Club
        </Link>
        <nav className="hidden gap-6 text-sm text-[#f3e9c8]/90 md:flex">
          <Link to="/" className="hover:text-[#f3e9c8]">Home</Link>
          <Link to="/membership" className="hover:text-[#f3e9c8]">Membership</Link>
          <Link to="/events" className="text-[#f3e9c8] underline-offset-4 hover:underline">
            Events
          </Link>
        </nav>
      </div>
    </header>
  );
}

function buildMonthGrid(cursor: Date): (Date | null)[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function loadEvents(): ClubEvent[] {
  if (typeof window === "undefined") return SEED_EVENTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_EVENTS;
    return JSON.parse(raw) as ClubEvent[];
  } catch {
    return SEED_EVENTS;
  }
}

function saveEvents(events: ClubEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    /* ignore */
  }
}
