import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Field } from "./index";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [{ title: "Create Account — SurplusLink" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const [tab, setTab] = useState<"donor" | "ngo">("donor");
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "donor") {
      navigate({ to: "/donor/dashboard" });
    } else {
      setSubmitted(true);
      setTimeout(() => navigate({ to: "/ngo/dashboard" }), 800);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">SurplusLink</h1>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-md bg-secondary p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab("donor")}
            className={`rounded py-1.5 transition ${tab === "donor" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Donor
          </button>
          <button
            type="button"
            onClick={() => setTab("ngo")}
            className={`rounded py-1.5 transition ${tab === "ngo" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            NGO
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "donor" ? <DonorFields /> : <NgoFields />}
          <button className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {tab === "donor" ? "Create Account" : submitted ? "Submitted ✓" : "Submit Application"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/" className="text-foreground hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

function DonorFields() {
  const [v, setV] = useState({ name: "", type: "", email: "", phone: "", address: "", pwd: "", confirm: "" });
  const set = (k: keyof typeof v) => (val: string) => setV({ ...v, [k]: val });
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Business Name" value={v.name} onChange={set("name")} placeholder="Fresh Market" />
        <Field label="Business Type" value={v.type} onChange={set("type")} placeholder="Grocery" />
      </div>
      <Field label="Email Address" type="email" value={v.email} onChange={set("email")} placeholder="contact@..." />
      <Field label="Phone Number" value={v.phone} onChange={set("phone")} placeholder="+1 555 0100" />
      <Field label="Business Address" value={v.address} onChange={set("address")} placeholder="123 Main St" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Password" type="password" value={v.pwd} onChange={set("pwd")} placeholder="••••••••" />
        <Field label="Confirm Password" type="password" value={v.confirm} onChange={set("confirm")} placeholder="••••••••" />
      </div>
    </>
  );
}

function NgoFields() {
  const [v, setV] = useState({ org: "", reg: "", email: "", phone: "", address: "", pwd: "", confirm: "" });
  const set = (k: keyof typeof v) => (val: string) => setV({ ...v, [k]: val });
  return (
    <>
      <Field label="Organization Name" value={v.org} onChange={set("org")} placeholder="Hope Shelter" />
      <Field label="NGO Registration Number" value={v.reg} onChange={set("reg")} placeholder="REG-12345" />
      <Field label="Email Address" type="email" value={v.email} onChange={set("email")} placeholder="contact@ngo.org" />
      <Field label="Phone Number" value={v.phone} onChange={set("phone")} placeholder="+1 555 0100" />
      <Field label="Address" value={v.address} onChange={set("address")} placeholder="123 Main St" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Password" type="password" value={v.pwd} onChange={set("pwd")} placeholder="••••••••" />
        <Field label="Confirm Password" type="password" value={v.confirm} onChange={set("confirm")} placeholder="••••••••" />
      </div>
    </>
  );
}
