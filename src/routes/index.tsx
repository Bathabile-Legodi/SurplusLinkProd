import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SurplusLink — Connect Surplus Food with Those Who Need It" },
      {
        name: "description",
        content:
          "SurplusLink helps food donors safely share surplus with verified NGOs. Reduce waste, feed communities.",
      },
      { property: "og:title", content: "SurplusLink" },
      {
        property: "og:description",
        content:
          "Connect surplus food with verified NGOs. Reduce waste, feed communities.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="font-semibold tracking-tight text-foreground">
            SurplusLink
          </span>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              to="/login"
              className="rounded-md border px-4 py-1.5 hover:bg-secondary"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-primary px-4 py-1.5 text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Turn surplus food into shared meals.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          SurplusLink connects businesses with surplus food to verified NGOs who
          can collect and redistribute it — reducing waste and feeding communities.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register"
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Join as a Donor
          </Link>
          <Link
            to="/register"
            className="rounded-md border px-6 py-2.5 text-sm font-medium hover:bg-secondary"
          >
            Join as an NGO
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-secondary/40 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-10 text-center text-2xl font-semibold">
            How it works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Step
              n="1"
              title="Donor logs surplus"
              body="Restaurants, grocers and producers list surplus food batches with pickup details."
            />
            <Step
              n="2"
              title="NGO claims donation"
              body="Verified nearby NGOs browse available donations and claim what they can collect."
            />
            <Step
              n="3"
              title="Pickup & distribution"
              body="The NGO collects the food and distributes it to the people they serve."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-10 text-center text-2xl font-semibold">
          Built for safety & speed
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <FeatureCard
            title="Verified NGOs"
            body="Every organization is reviewed before they can claim donations, so donors know their surplus is in good hands."
          />
          <FeatureCard
            title="Real-time tracking"
            body="Follow donations from claim to pickup with simple status updates and notifications."
          />
          <FeatureCard
            title="Simple batch logging"
            body="Donors can log a whole batch in seconds — category, quantity, pickup window and location."
          />
          <FeatureCard
            title="Impact reporting"
            body="See how many meals you've helped serve and track your organization's contribution over time."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-semibold">Ready to make an impact?</h2>
          <p className="mt-3 opacity-90">
            Whether you're a business with surplus food or an NGO feeding your
            community, getting started takes less than two minutes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="rounded-md bg-white px-6 py-2.5 text-sm font-medium text-primary hover:bg-white/90"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="rounded-md border border-white/40 px-6 py-2.5 text-sm font-medium hover:bg-white/10"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} SurplusLink. All rights reserved.</p>
      </footer>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {n}
      </div>
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
