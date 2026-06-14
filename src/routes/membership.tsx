import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/membership")({
  head: () => ({
    meta: [
      { title: "Become a Member — Cullinan Golf Club" },
      {
        name: "description",
        content:
          "Membership fees, monthly options, prepaid rounds and green fees at Cullinan Golf Club for the 2026/27 season.",
      },
      { property: "og:title", content: "Become a Member — Cullinan Golf Club" },
      {
        property: "og:description",
        content:
          "Join Cullinan Golf Club. View membership categories, monthly debit-order options, prepaid round packages and full green-fee schedule.",
      },
    ],
  }),
  component: MembershipPage,
});

const membershipTypes: { type: string; fee: string; comments?: string }[] = [
  { type: "Junior Member", fee: "R1 450.00" },
  { type: "Student Member", fee: "R2 150.00" },
  { type: "Country Member", fee: "R1 450.00" },
  { type: "Affiliated Member", fee: "R3 000.00" },
  { type: "Pensioner Affiliated", fee: "R2 150.00" },
];

const monthly: { type: string; fee: string; comments: string }[] = [
  { type: "Debit Order Full Member", fee: "R725.00 / month", comments: "24 free rounds per year" },
  { type: "Unlimited Member", fee: "R12 500.00 (once-off)", comments: "Unlimited rounds" },
];

const prepaidGents = [
  { price: "R2 850.00", rounds: "12 rounds" },
  { price: "R5 400.00", rounds: "24 rounds" },
  { price: "R7 750.00", rounds: "36 rounds" },
];
const prepaidPensioners = [
  { price: "R1 900.00", rounds: "12 rounds" },
  { price: "R3 650.00", rounds: "24 rounds" },
  { price: "R5 300.00", rounds: "36 rounds" },
];

const greenFees: { who: string; day: string; nine: string; eighteen: string }[] = [
  { who: "Members", day: "Weekday", nine: "R160.00", eighteen: "R260.00" },
  { who: "Members", day: "Weekend", nine: "R200.00", eighteen: "R330.00" },
  { who: "Pensioner Members", day: "Weekday", nine: "R110.00", eighteen: "R180.00" },
  { who: "Pensioner Members", day: "Weekend", nine: "R160.00", eighteen: "R260.00" },
  { who: "Pensioner Visitor", day: "Weekday", nine: "R190.00", eighteen: "R210.00" },
  { who: "Pensioner Visitor", day: "Weekend", nine: "R250.00", eighteen: "R270.00" },
  { who: "Affiliated Visitor", day: "Weekday", nine: "R170.00", eighteen: "R290.00" },
  { who: "Affiliated Visitor", day: "Weekend", nine: "R210.00", eighteen: "R350.00" },
  { who: "Non Members", day: "Weekday", nine: "R220.00", eighteen: "R360.00" },
  { who: "Non Members", day: "Weekend", nine: "R260.00", eighteen: "R440.00" },
  { who: "Juniors Member", day: "Weekday", nine: "R0.00", eighteen: "R0.00" },
  { who: "Juniors Member", day: "Weekend", nine: "R80.00", eighteen: "R140.00" },
  { who: "Juniors Visitors", day: "Weekday", nine: "R100.00", eighteen: "R170.00" },
  { who: "Juniors Visitors", day: "Weekend", nine: "R130.00", eighteen: "R210.00" },
  { who: "Country Members", day: "Weekday", nine: "R170.00", eighteen: "R290.00" },
  { who: "Country Members", day: "Weekend", nine: "R210.00", eighteen: "R350.00" },
  { who: "Student Member", day: "Weekday", nine: "R110.00", eighteen: "R180.00" },
  { who: "Student Member", day: "Weekend", nine: "R160.00", eighteen: "R260.00" },
  { who: "Student Visitor", day: "Weekday", nine: "R130.00", eighteen: "R210.00" },
  { who: "Student Visitor", day: "Weekend", nine: "R160.00", eighteen: "R270.00" },
  { who: "Golf Cart", day: "Every Day", nine: "R260.00", eighteen: "R440.00" },
];

function MembershipPage() {
  return (
    <div className="min-h-screen bg-[#f8f6f0] text-[#1c2b1f]">
      <PageHeader />

      {/* HERO */}
      <section className="bg-[#0f2417] pt-28 pb-16 text-[#f3e9c8]">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-[#f3e9c8]/70">
            Membership 2026 / 2027
          </span>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl">Become a Member</h1>
          <p className="mx-auto mt-5 max-w-2xl text-[#f3e9c8]/80">
            Our membership year runs from <strong>1 March 2026</strong> to{" "}
            <strong>28 February 2027</strong>. Pro-rata rates are charged for members joining during
            the year; however, the full affiliation fees are still due.
          </p>
        </div>
      </section>

      {/* Annual Memberships */}
      <Section title="Annual Membership Fees">
        <PriceTable
          headers={["Membership Type", "Fee", "Comments"]}
          rows={membershipTypes.map((m) => [m.type, m.fee, m.comments ?? "—"])}
        />
      </Section>

      {/* Monthly */}
      <Section title="Monthly Members">
        <PriceTable
          headers={["Type", "Fee", "Comments"]}
          rows={monthly.map((m) => [m.type, m.fee, m.comments])}
        />
      </Section>

      {/* Prepaid */}
      <Section title="Additional Prepaid Rounds">
        <p className="mb-6 text-sm text-[#1c2b1f]/70">
          Prepaid rounds are available for affiliated members as well.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <PrepaidCard title="Gents / Ladies" rows={prepaidGents} />
          <PrepaidCard title="Pensioners / Students" rows={prepaidPensioners} />
        </div>
      </Section>

      {/* Green Fees */}
      <Section title="Green Fees">
        <div className="overflow-x-auto rounded-xl border border-[#0f2417]/10 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#0f2417] text-[#f3e9c8]">
              <tr>
                <th className="px-4 py-3 text-left font-serif font-normal">Category</th>
                <th className="px-4 py-3 text-left font-serif font-normal">Day</th>
                <th className="px-4 py-3 text-right font-serif font-normal">9 Holes</th>
                <th className="px-4 py-3 text-right font-serif font-normal">18 Holes</th>
              </tr>
            </thead>
            <tbody>
              {greenFees.map((r, i) => (
                <tr key={i} className="border-t border-[#0f2417]/5 even:bg-[#f8f6f0]">
                  <td className="px-4 py-3">{r.who}</td>
                  <td className="px-4 py-3 text-[#1c2b1f]/70">{r.day}</td>
                  <td className="px-4 py-3 text-right font-medium">{r.nine}</td>
                  <td className="px-4 py-3 text-right font-medium">{r.eighteen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Specials */}
      <Section title="Weekday & Sunday Specials">
        <div className="grid gap-5 md:grid-cols-2">
          <SpecialCard
            title="Weekday 18 Holes Special"
            items={[
              { label: "Affiliated members · Tuesdays & Wednesdays", price: "R900.00" },
              { label: "Affiliated pensioners · Thursdays · 2 players / 1 cart", price: "R800.00" },
            ]}
          />
          <SpecialCard
            title="Sunday 18 Holes Special"
            items={[{ label: "Affiliated visitors · 4-ball", price: "R1 900.00" }]}
          />
        </div>
      </Section>

      <section className="bg-[#0f2417] py-14 text-center text-[#f3e9c8]">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-serif text-3xl">Ready to join the club?</h2>
          <p className="mt-3 text-[#f3e9c8]/80">
            Contact our office and we'll guide you through the membership application.
          </p>
          <Link
            to="/"
            hash="contact"
            className="mt-6 inline-block rounded-full bg-[#f3e9c8] px-7 py-3 text-sm font-semibold text-[#0f2417] transition hover:bg-white"
          >
            Contact the Club
          </Link>
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
          <Link to="/membership" className="text-[#f3e9c8] underline-offset-4 hover:underline">
            Membership
          </Link>
          <Link to="/events" className="hover:text-[#f3e9c8]">Events</Link>
        </nav>
      </div>
    </header>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-14">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="mb-6 font-serif text-2xl md:text-3xl">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function PriceTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#0f2417]/10 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-[#0f2417] text-[#f3e9c8]">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 font-serif font-normal ${i === 1 ? "text-right" : "text-left"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[#0f2417]/5 even:bg-[#f8f6f0]">
              {r.map((c, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 ${j === 1 ? "text-right font-medium" : ""} ${j === 2 ? "text-[#1c2b1f]/70" : ""}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PrepaidCard({
  title,
  rows,
}: {
  title: string;
  rows: { price: string; rounds: string }[];
}) {
  return (
    <div className="rounded-xl border border-[#0f2417]/10 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-serif text-xl">{title}</h3>
      <ul className="divide-y divide-[#0f2417]/10">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between py-3">
            <span className="text-[#1c2b1f]/80">{r.rounds}</span>
            <span className="font-semibold">{r.price}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpecialCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; price: string }[];
}) {
  return (
    <div className="rounded-xl border border-[#0f2417]/10 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-serif text-xl">{title}</h3>
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="flex items-start justify-between gap-4">
            <span className="text-sm text-[#1c2b1f]/80">{it.label}</span>
            <span className="whitespace-nowrap font-semibold">{it.price}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
