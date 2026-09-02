import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Field } from "@/components/Field";
import { toast } from "sonner";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { Logo } from "@/components/Logo";

interface AddressComponents {
  streetNumber: string;
  streetName: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  formatted: string;
  lat: number | null;
  lng: number | null;
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
  streetNumber: "",
  streetName: "",
  suburb: "",
  city: "",
  province: "",
  postalCode: "",
  country: "",
  formatted: "",
  lat: null,
  lng: null,
});

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [{ title: "Create Account — SurplusLink" }],
  }),
  component: RegisterPage,
});

// useGoogleMaps is now imported from @/hooks/useGoogleMaps

function AddressAutocomplete({
  value,
  onChange,
}: {
  value: AddressComponents;
  onChange: (addr: AddressComponents) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<any>(null);
  const mapsReady = useGoogleMaps("places");

  // Ref prevents stale closure when gmp-select fires
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!mapsReady || !containerRef.current) return;
    if (elementRef.current) return;

    const gPlaces = (window as any).google?.maps?.places;
    if (!gPlaces || !gPlaces.PlaceAutocompleteElement) {
      console.warn("PlaceAutocompleteElement not available yet.");
      return;
    }

    const placeAutocomplete = new gPlaces.PlaceAutocompleteElement({
      componentRestrictions: { country: "ZA" },
      types: ["address"],
    });

    if (value.formatted) {
      placeAutocomplete.value = value.formatted;
    }

    elementRef.current = placeAutocomplete;
    containerRef.current.appendChild(placeAutocomplete);

    placeAutocomplete.addEventListener("gmp-select", async (event: any) => {
      const placePrediction = event.placePrediction;
      if (!placePrediction) return;

      const place = placePrediction.toPlace();

      await place.fetchFields({
        fields: ["addressComponents", "formattedAddress", "location"],
      });

      const get = (type: string) =>
        place.addressComponents?.find((c: any) => c.types.includes(type))
          ?.longText ?? "";

      const lat =
        typeof place.location?.lat === "function" ? place.location.lat() : null;
      const lng =
        typeof place.location?.lng === "function" ? place.location.lng() : null;

      onChangeRef.current({
        streetNumber: get("street_number"),
        streetName: get("route"),
        suburb: get("sublocality") || get("neighborhood"),
        city: get("locality"),
        province: get("administrative_area_level_1"),
        postalCode: get("postal_code"),
        country: get("country"),
        formatted: place.formattedAddress ?? "",
        lat,
        lng,
      });
    });

    return () => {
      if (containerRef.current && elementRef.current) {
        try {
          containerRef.current.removeChild(elementRef.current);
        } catch (_) {}
        elementRef.current = null;
      }
    };
  }, [mapsReady]);

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground">
        Address
      </label>
      {!mapsReady && (
        <input
          type="text"
          disabled
          value={value.formatted || ""}
          placeholder="Loading address search…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:opacity-50"
        />
      )}
      <div ref={containerRef} className={!mapsReady ? "hidden" : ""} />
    </div>
  );
}

function ComboField({
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  options: string[];
  placeholder?: string;
  error?: string;
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

  useEffect(() => {
    setQuery(value);
  }, [value]);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full rounded-md border bg-background px-3 py-2 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors
            ${
              error
                ? "border-destructive focus:ring-destructive"
                : "border-input focus:border-ring focus:ring-ring"
            }`}
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-input bg-card py-1 shadow-md">
          {filtered.map((opt) => (
            <li
              key={opt}
              onMouseDown={() => {
                setQuery(opt);
                onChange(opt);
                setOpen(false);
              }}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-secondary"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className="mt-1 text-[11px] text-destructive leading-tight">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  error,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  onBlur?: () => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="••••••••"
          autoComplete="new-password"
          className={`w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors
            ${
              error
                ? "border-destructive focus:ring-destructive"
                : "border-input focus:border-ring focus:ring-ring"
            }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          {show ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-destructive leading-tight">{error}</p>
      )}
    </div>
  );
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidPhone(v: string) {
  return /^[+\d][\d\s\-()]{6,}$/.test(v.trim());
}

function RegisterPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<"donor" | "ngo">("donor");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validateDonor(d = donorData) {
    const e: Record<string, string> = {};
    if (!d.name.trim()) e.name = "Business name is required.";
    if (!d.type.trim()) e.type = "Please select a business type.";
    if (!d.email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(d.email)) e.email = "Enter a valid email address.";
    if (!d.phone.trim()) e.phone = "Phone number is required.";
    else if (!isValidPhone(d.phone)) e.phone = "Enter a valid phone number.";
    if (!d.address.formatted)
      e.address = "Please select an address from the suggestions.";
    if (!d.password) e.password = "Password is required.";
    else if (d.password.length < 8) e.password = "Must be at least 8 characters.";
    if (!d.confirmPassword)
      e.confirmPassword = "Please confirm your password.";
    else if (d.password !== d.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    return e;
  }

  function validateNgo(d = ngoData) {
    const e: Record<string, string> = {};
    if (!d.org.trim()) e.org = "Organisation name is required.";
    if (!d.reg.trim()) e.reg = "Registration number is required.";
    if (!d.email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(d.email)) e.email = "Enter a valid email address.";
    if (!d.phone.trim()) e.phone = "Phone number is required.";
    else if (!isValidPhone(d.phone)) e.phone = "Enter a valid phone number.";
    if (!d.address.formatted)
      e.address = "Please select an address from the suggestions.";
    if (!d.password) e.password = "Password is required.";
    else if (d.password.length < 8) e.password = "Must be at least 8 characters.";
    if (!d.confirmPassword)
      e.confirmPassword = "Please confirm your password.";
    else if (d.password !== d.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    return e;
  }

  function runValidation() {
    return tab === "donor" ? validateDonor() : validateNgo();
  }

  function touch(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
    const errs = runValidation();
    setErrors(errs);
  }

  function err(field: string) {
    return touched[field] ? errors[field] : undefined;
  }

  function onDonorChange(key: string, value: string) {
    setDonorData((prev) => {
      const next = { ...prev, [key]: value };
      if (touched[key]) setErrors(validateDonor(next));
      return next;
    });
  }

  function onNgoChange(key: string, value: string) {
    setNgoData((prev) => {
      const next = { ...prev, [key]: value };
      if (touched[key]) setErrors(validateNgo(next));
      return next;
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const allDonorKeys = [
      "name",
      "type",
      "email",
      "phone",
      "address",
      "password",
      "confirmPassword",
    ];
    const allNgoKeys = [
      "org",
      "reg",
      "email",
      "phone",
      "address",
      "password",
      "confirmPassword",
    ];
    const keys = tab === "donor" ? allDonorKeys : allNgoKeys;
    const allTouched = Object.fromEntries(keys.map((k) => [k, true]));
    setTouched(allTouched);
    const errs = runValidation();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const data = tab === "donor" ? donorData : ngoData;
    const addressString = data.address.formatted;

    const isValidNgoPrefix = tab === "ngo" && ngoData.reg.trim().startsWith("NGO-REG009");
    const isVerified = tab === "donor" ? true : isValidNgoPrefix;

    const { data: signUpData, error: supabaseError } = await supabase.auth.signUp({
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
                is_verified: true,
              }
            : {
                role: "ngo",
                organization_name: ngoData.org,
                registration_number: ngoData.reg,
                phone: ngoData.phone,
                address: addressString,
                address_components: ngoData.address,
                is_verified: isVerified,
              },
      },
    });

    if (supabaseError) {
      setLoading(false);
      if (
        supabaseError.status === 429 ||
        supabaseError.message.toLowerCase().includes("rate limit")
      ) {
        toast.error(
          "Too many registration attempts. Please wait a few minutes before trying again."
        );
        return;
      }

      const msg = supabaseError.message.toLowerCase();
      if (msg.includes("email")) {
        setErrors({ email: supabaseError.message });
        setTouched((t) => ({ ...t, email: true }));
      } else {
        toast.error(supabaseError.message);
      }
      return;
    }

    if (tab === "ngo" && !isVerified) {
      if (!signUpData.session) {
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
      }
      setLoading(false);
      toast.success("Account created! Pending organization validation.");
      navigate({ to: "/ngo/dashboard" });
      return;
    }

    setLoading(false);

    if (signUpData.user && !signUpData.session) {
      setRegisteredEmail(data.email);
      setEmailSent(true);
      toast.success("Confirmation email sent! Please check your inbox.");
    } else {
      toast.success("Account created successfully!");
      navigate({ to: tab === "donor" ? "/donor/dashboard" : "/ngo/dashboard" });
    }
  }

  if (emailSent) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden px-4 py-10">
        {/* Abstract animated background blobs */}
        <div className="pointer-events-none absolute -top-1/4 left-0 h-[500px] w-[500px] animate-pulse rounded-full bg-primary/20 blur-[120px] [animation-duration:8s]" />
        <div className="pointer-events-none absolute -bottom-1/4 right-0 h-[600px] w-[600px] animate-pulse rounded-full bg-primary/10 blur-[150px] [animation-duration:12s]" />

        <div className="relative w-full max-w-md rounded-3xl glass-lg p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500 ease-out text-center" style={{boxShadow: '0 20px 60px oklch(0.18 0.16 264 / 0.18), 0 4px 16px oklch(0.18 0.16 264 / 0.10)'}}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">
              {registeredEmail}
            </span>
            . Please confirm your email address to activate your account.
          </p>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-block w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 hover:shadow-lg transition-all"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden px-4 py-10">
      {/* Abstract animated background blobs */}
      <div className="pointer-events-none absolute -top-1/4 left-0 h-[500px] w-[500px] animate-pulse rounded-full bg-primary/20 blur-[120px] [animation-duration:8s]" />
      <div className="pointer-events-none absolute -bottom-1/4 right-0 h-[600px] w-[600px] animate-pulse rounded-full bg-primary/10 blur-[150px] [animation-duration:12s]" />

      <div className="relative w-full max-w-md rounded-3xl glass-lg p-8 animate-in fade-in zoom-in-95 duration-500 ease-out" style={{boxShadow: '0 20px 60px oklch(0.18 0.16 264 / 0.18), 0 4px 16px oklch(0.18 0.16 264 / 0.10)'}}>
        <div className="mb-6 flex justify-center">
          <Logo className="h-10" />
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-black/5 p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setTab("donor");
              setErrors({});
              setTouched({});
            }}
            className={`rounded-lg py-2 font-medium transition-all ${
              tab === "donor"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Donor
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("ngo");
              setErrors({});
              setTouched({});
            }}
            className={`rounded-lg py-2 font-medium transition-all ${
              tab === "ngo"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            NGO
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {tab === "donor" ? (
            <DonorFields
              values={donorData}
              onChange={onDonorChange}
              setAddress={(addr) => {
                setDonorData((prev) => {
                  const next = { ...prev, address: addr };
                  if (touched.address) setErrors(validateDonor(next));
                  return next;
                });
              }}
              err={err}
              touch={touch}
            />
          ) : (
            <NgoFields
              values={ngoData}
              onChange={onNgoChange}
              setAddress={(addr) => {
                setNgoData((prev) => {
                  const next = { ...prev, address: addr };
                  if (touched.address) setErrors(validateNgo(next));
                  return next;
                });
              }}
              err={err}
              touch={touch}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating Account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-foreground hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

type DonorProps = {
  values: any;
  onChange: (key: string, value: string) => void;
  setAddress: (addr: AddressComponents) => void;
  err: (field: string) => string | undefined;
  touch: (field: string) => void;
};

function DonorFields({ values, onChange, setAddress, err, touch }: DonorProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Business Name"
          value={values.name}
          onChange={(v) => onChange("name", v)}
          onBlur={() => touch("name")}
          placeholder="Fresh Market"
          error={err("name")}
        />
        <ComboField
          label="Business Type"
          value={values.type}
          onChange={(v) => onChange("type", v)}
          onBlur={() => touch("type")}
          options={BUSINESS_TYPES}
          placeholder="Grocery, Bakery…"
          error={err("type")}
        />
      </div>

      <Field
        label="Email Address"
        type="email"
        value={values.email}
        onChange={(v) => onChange("email", v)}
        onBlur={() => touch("email")}
        placeholder="contact@example.com"
        error={err("email")}
      />
      <Field
        label="Phone Number"
        value={values.phone}
        onChange={(v) => onChange("phone", v)}
        onBlur={() => touch("phone")}
        placeholder="+27 "
        error={err("phone")}
      />

      <div>
        <AddressAutocomplete
          value={values.address}
          onChange={(addr) => setAddress(addr)}
        />
        {err("address") && (
          <p className="mt-1 text-[11px] text-destructive leading-tight">
            {err("address")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PasswordField
          label="Password"
          value={values.password}
          onChange={(v) => onChange("password", v)}
          onBlur={() => touch("password")}
          error={err("password")}
        />
        <PasswordField
          label="Confirm Password"
          value={values.confirmPassword}
          onChange={(v) => onChange("confirmPassword", v)}
          onBlur={() => touch("confirmPassword")}
          error={err("confirmPassword")}
        />
      </div>
    </>
  );
}

type NgoProps = {
  values: any;
  onChange: (key: string, value: string) => void;
  setAddress: (addr: AddressComponents) => void;
  err: (field: string) => string | undefined;
  touch: (field: string) => void;
};

function NgoFields({ values, onChange, setAddress, err, touch }: NgoProps) {
  return (
    <>
      <Field
        label="Organisation Name"
        value={values.org}
        onChange={(v) => onChange("org", v)}
        onBlur={() => touch("org")}
        placeholder="Hope Shelter"
        error={err("org")}
      />

      <Field
        label="NGO Registration Number"
        value={values.reg}
        onChange={(v) => onChange("reg", v)}
        onBlur={() => touch("reg")}
        placeholder="NGO-REG00912345"
        error={err("reg")}
      />

      <Field
        label="Email Address"
        type="email"
        value={values.email}
        onChange={(v) => onChange("email", v)}
        onBlur={() => touch("email")}
        placeholder="contact@ngo.org"
        error={err("email")}
      />

      <Field
        label="Phone Number"
        value={values.phone}
        onChange={(v) => onChange("phone", v)}
        onBlur={() => touch("phone")}
        placeholder="+27..."
        error={err("phone")}
      />

      <div>
        <AddressAutocomplete
          value={values.address}
          onChange={(addr) => setAddress(addr)}
        />
        {err("address") && (
          <p className="mt-1 text-[11px] text-destructive leading-tight">
            {err("address")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PasswordField
          label="Password"
          value={values.password}
          onChange={(v) => onChange("password", v)}
          onBlur={() => touch("password")}
          error={err("password")}
        />
        <PasswordField
          label="Confirm Password"
          value={values.confirmPassword}
          onChange={(v) => onChange("confirmPassword", v)}
          onBlur={() => touch("confirmPassword")}
          error={err("confirmPassword")}
        />
      </div>
    </>
  );
}