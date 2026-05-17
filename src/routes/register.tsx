import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Field } from "./index";



export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [{ title: "Create Account — SurplusLink" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<"donor" | "ngo">("donor");

  const [loading, setLoading] = useState(false);

  const [donorData, setDonorData] = useState({
    name: "",
    type: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [ngoData, setNgoData] = useState({
    org: "",
    reg: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const data = tab === "donor" ? donorData : ngoData;

    if (data.password !== data.confirmPassword) {
      alert("Passwords do not match");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data:
          tab === "donor"
            ? {
                role: "donor",
                business_name: donorData.name,
                business_type: donorData.type,
                phone: donorData.phone,
                address: donorData.address,
              }
            : {
                role: "ngo",
                organization_name: ngoData.org,
                registration_number: ngoData.reg,
                phone: ngoData.phone,
                address: ngoData.address,
              },
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Account created successfully!");

    if (tab === "donor") {
      navigate({ to: "/donor/dashboard" });
    } else {
      navigate({ to: "/ngo/dashboard" });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            SurplusLink
          </h1>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-md bg-secondary p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab("donor")}
            className={`rounded py-1.5 transition ${
              tab === "donor"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            Donor
          </button>

          <button
            type="button"
            onClick={() => setTab("ngo")}
            className={`rounded py-1.5 transition ${
              tab === "ngo"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            NGO
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "donor" ? (
            <DonorFields
              values={donorData}
              setValues={setDonorData}
            />
          ) : (
            <NgoFields
              values={ngoData}
              setValues={setNgoData}
            />
          )}

          <button
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-foreground hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

type DonorProps = {
  values: any;
  setValues: React.Dispatch<React.SetStateAction<any>>;
};

function DonorFields({ values, setValues }: DonorProps) {
  const set =
    (key: string) => (value: string) =>
      setValues((prev: any) => ({
        ...prev,
        [key]: value,
      }));

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Business Name"
          value={values.name}
          onChange={set("name")}
          placeholder="Fresh Market"
        />

        <Field
          label="Business Type"
          value={values.type}
          onChange={set("type")}
          placeholder="Grocery"
        />
      </div>

      <Field
        label="Email Address"
        type="email"
        value={values.email}
        onChange={set("email")}
        placeholder="contact@example.com"
      />

      <Field
        label="Phone Number"
        value={values.phone}
        onChange={set("phone")}
        placeholder="+27..."
      />

      <Field
        label="Business Address"
        value={values.address}
        onChange={set("address")}
        placeholder="123 Main St"
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Password"
          type="password"
          value={values.password}
          onChange={set("password")}
          placeholder="••••••••"
        />

        <Field
          label="Confirm Password"
          type="password"
          value={values.confirmPassword}
          onChange={set("confirmPassword")}
          placeholder="••••••••"
        />
      </div>
    </>
  );
}

type NgoProps = {
  values: any;
  setValues: React.Dispatch<React.SetStateAction<any>>;
};

function NgoFields({ values, setValues }: NgoProps) {
  const set =
    (key: string) => (value: string) =>
      setValues((prev: any) => ({
        ...prev,
        [key]: value,
      }));

  return (
    <>
      <Field
        label="Organization Name"
        value={values.org}
        onChange={set("org")}
        placeholder="Hope Shelter"
      />

      <Field
        label="NGO Registration Number"
        value={values.reg}
        onChange={set("reg")}
        placeholder="REG-12345"
      />

      <Field
        label="Email Address"
        type="email"
        value={values.email}
        onChange={set("email")}
        placeholder="contact@ngo.org"
      />

      <Field
        label="Phone Number"
        value={values.phone}
        onChange={set("phone")}
        placeholder="+27..."
      />

      <Field
        label="Address"
        value={values.address}
        onChange={set("address")}
        placeholder="123 Main St"
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Password"
          type="password"
          value={values.password}
          onChange={set("password")}
          placeholder="••••••••"
        />

        <Field
          label="Confirm Password"
          type="password"
          value={values.confirmPassword}
          onChange={set("confirmPassword")}
          placeholder="••••••••"
        />
      </div>
    </>
  );
}