import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { FormEvent  } from "react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Field } from "@/components/Field";

interface AddressComponents {
  streetNumber: string;
  streetName: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  formatted: string;
}

const BUSINESS_TYPES = [
  "Grocery / Supermarket",
  "Restaurant / Café",
  "Bakery",
  "Food Manufacturer",
  "Wholesaler / Distributor",
  "Hotel / Hospitality",
  "Catering Company",
  "Farm / Agricultural",
  "Convenience Store",
  "Other",
];

const emptyAddress = (): AddressComponents => ({
  streetNumber: "", streetName: "", suburb: "",
  city: "", province: "", postalCode: "", country: "", formatted: "",
});


export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [{ title: "Create Account — SurplusLink" }],
  }),
  component: RegisterPage,
});


// Google Maps loader removed — registration now uses a plain text address input.

function AddressAutocomplete({ value, onChange }: { value: AddressComponents; onChange: (addr: AddressComponents) => void; }) {
  // Simple text input for address (no external autocomplete)
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground">Address</label>
      <input
        type="text"
        value={value.formatted}
        onChange={(e) =>
          onChange({
            streetNumber: "",
            streetName: "",
            suburb: "",
            city: "",
            province: "",
            postalCode: "",
            country: "",
            formatted: e.target.value,
          })
        }
        placeholder="Street address, suburb, city"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

function ComboField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { setQuery(value); }, [value]);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-input bg-card py-1 shadow-md">
          {filtered.map((opt) => (
            <li
              key={opt}
              onMouseDown={() => { setQuery(opt); onChange(opt); setOpen(false); }}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-secondary"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          {show ? (
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
  );
}

function RegisterPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<"donor" | "ngo">("donor");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [donorData, setDonorData] = useState({
    name: "",
    type: "",
    email: "",
    phone: "",
    address: emptyAddress(),
    password: "",
    confirmPassword: "",
  });

  const [ngoData, setNgoData] = useState({
    org: "",
    reg: "",
    email: "",
    phone: "",
    address: emptyAddress(),
    password: "",
    confirmPassword: "",
  });



  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const data = tab === "donor" ? donorData : ngoData;

    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

     if (data.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!data.address.formatted) {
      setError("Please select an address from the suggestions.");
      return;
    }

    setLoading(true);

    const addressString = data.address.formatted;
    
    const { error: supabaseError } = await supabase.auth.signUp({
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
                address: addressString,
                address_components: donorData.address,
              }
            : {
                role: "ngo",
                organization_name: ngoData.org,
                registration_number: ngoData.reg,
                phone: ngoData.phone,
                address: addressString,
                address_components: ngoData.address,
              },
      },
    });

    setLoading(false);

    if (supabaseError) {
      setError(supabaseError.message);
      return;
    }

    navigate({ to: tab === "donor" ? "/donor/dashboard" : "/ngo/dashboard" });
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
            className={`rounded py-1.5 text-center transition ${
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
            className={`rounded py-1.5 text-center transition ${
              tab === "ngo"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            NGO
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

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
            type="submit" 
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground text-center hover:bg-primary/90 disabled:opacity-50"
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

        <ComboField
        label="Business Type"
        value={values.type}
        onChange={set("type")}
        options={BUSINESS_TYPES}
        placeholder="Grocery, Bakery…"
      />
      </div>

      <Field label="Email Address" type="email" value={values.email} onChange={set("email")} placeholder="contact@example.com" />
      <Field label="Phone Number" value={values.phone} onChange={set("phone")} placeholder="+27 " />

      <AddressAutocomplete
        value={values.address}
        onChange={(addr) => setValues((prev: any) => ({ ...prev, address: addr }))}
      />
  
      <div className="grid grid-cols-2 gap-3">
        <PasswordField label="Password" value={values.password} onChange={set("password")} />
        <PasswordField label="Confirm Password" value={values.confirmPassword} onChange={set("confirmPassword")} />
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

      <AddressAutocomplete
        value={values.address}
        onChange={(addr) => setValues((prev: any) => ({ ...prev, address: addr }))}
      />

      <div className="grid grid-cols-2 gap-3">
        <PasswordField label="Password" value={values.password} onChange={set("password")} />
        <PasswordField label="Confirm Password" value={values.confirmPassword} onChange={set("confirmPassword")} />
      </div>
    </>
  );
}