import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { Dispatch, FormEvent, SetStateAction } from "react";
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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

  const [showPassword, setShowPassword] = useState(false);         
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 

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

      {/* Password fields with show/hide */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Password</label>
          <div style={{ position: "relative" }}>
            <input
              style={{ paddingRight: "2.5rem", width: "100%", boxSizing: "border-box" }}
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={(e) => set("password")(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                zIndex: 10,
                color: "black",
              }}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Confirm Password</label>
          <div style={{ position: "relative" }}>
            <input
              style={{ paddingRight: "2.5rem", width: "100%", boxSizing: "border-box" }}
              type={showConfirmPassword ? "text" : "password"}
              value={values.confirmPassword}
              onChange={(e) => set("confirmPassword")(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                zIndex: 10,
                color: "black",
              }}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

type NgoProps = {
  values: any;
  setValues: React.Dispatch<React.SetStateAction<any>>;
};

function NgoFields({ values, setValues }: NgoProps) {

  const [showPassword, setShowPassword] = useState(false);         
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 

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

      {/* Password fields with show/hide */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Password</label>
          <div style={{ position: "relative" }}>
            <input
              style={{ paddingRight: "2.5rem", width: "100%", boxSizing: "border-box" }}
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={(e) => set("password")(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                zIndex: 10,
                color: "black",
              }}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Confirm Password</label>
          <div style={{ position: "relative" }}>
            <input
              style={{ paddingRight: "2.5rem", width: "100%", boxSizing: "border-box" }}
              type={showConfirmPassword ? "text" : "password"}
              value={values.confirmPassword}
              onChange={(e) => set("confirmPassword")(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                zIndex: 10,
                color: "black",
              }}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}