import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Field } from "@/components/Field";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller, type Control, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
  streetNumber: "",
  streetName: "",
  suburb: "",
  city: "",
  province: "",
  postalCode: "",
  country: "",
  formatted: "",
});

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [{ title: "Create Account — SurplusLink" }],
  }),
  component: RegisterPage,
});

function useGoogleMaps() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ((window as any).google?.maps?.places) {
      setReady(true);
      return;
    }

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => setReady(true));
      return;
    }

    (window as any).initGoogleMaps = () => setReady(true);

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      delete (window as any).initGoogleMaps;
    };
  }, []);

  return ready;
}

function AddressAutocomplete({
  value,
  onChange,
}: {
  value: AddressComponents;
  onChange: (addr: AddressComponents) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<any>(null);
  const mapsReady = useGoogleMaps();

  useEffect(() => {
    if (!mapsReady || !containerRef.current) return;
    if (elementRef.current) return;

    const gPlaces = (window as any).google.maps.places;

    if (!gPlaces.PlaceAutocompleteElement) {
      console.warn("PlaceAutocompleteElement not available.");
      return;
    }

    const placeAutocomplete = new gPlaces.PlaceAutocompleteElement({
      includedRegionCodes: ["za"],
      types: ["address"],
    });

    elementRef.current = placeAutocomplete;
    containerRef.current.appendChild(placeAutocomplete);

    placeAutocomplete.addEventListener("gmp-select", async (event: any) => {
      const placePrediction = event.placePrediction;
      if (!placePrediction) return;

      const place = placePrediction.toPlace();

      await place.fetchFields({
        fields: ["addressComponents", "formattedAddress"],
      });

      const get = (type: string) =>
        place.addressComponents?.find((c: any) => c.types.includes(type))
          ?.longText ?? "";

      onChange({
        streetNumber: get("street_number"),
        streetName: get("route"),
        suburb: get("sublocality") || get("neighborhood"),
        city: get("locality"),
        province: get("administrative_area_level_1"),
        postalCode: get("postal_code"),
        country: get("country"),
        formatted: place.formattedAddress ?? "",
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
          placeholder="Loading…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:opacity-50"
        />
      )}
      <div
        ref={containerRef}
        className={!mapsReady ? "hidden" : ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      />
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

const phoneRegex = /^[+\d][\d\s\-()]{6,}$/;

const addressSchema = z.object({
  streetNumber: z.string(),
  streetName: z.string(),
  suburb: z.string(),
  city: z.string(),
  province: z.string(),
  postalCode: z.string(),
  country: z.string(),
  formatted: z.string().min(1, "Please select an address from the suggestions."),
});

const donorSchema = z.object({
  name: z.string().min(1, "Business name is required."),
  type: z.string().min(1, "Please select a business type."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().regex(phoneRegex, "Enter a valid phone number."),
  address: addressSchema,
  password: z.string().min(8, "Must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const ngoSchema = z.object({
  org: z.string().min(1, "Organisation name is required."),
  reg: z.string().min(1, "Registration number is required."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().regex(phoneRegex, "Enter a valid phone number."),
  address: addressSchema,
  password: z.string().min(8, "Must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type DonorForm = z.infer<typeof donorSchema>;
type NgoForm = z.infer<typeof ngoSchema>;

function RegisterPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<"donor" | "ngo">("donor");
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const donorForm = useForm<DonorForm>({
    resolver: zodResolver(donorSchema),
    defaultValues: { name: "", type: "", email: "", phone: "", address: emptyAddress(), password: "", confirmPassword: "" },
  });

  const ngoForm = useForm<NgoForm>({
    resolver: zodResolver(ngoSchema),
    defaultValues: { org: "", reg: "", email: "", phone: "", address: emptyAddress(), password: "", confirmPassword: "" },
  });

  const isSubmitting = tab === "donor" ? donorForm.formState.isSubmitting : ngoForm.formState.isSubmitting;

  async function handleDonorSubmit(data: DonorForm) {
    const addressString = data.address.formatted;
    const { data: signUpData, error: supabaseError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: "donor",
          business_name: data.name,
          business_type: data.type,
          phone: data.phone,
          address: addressString,
          address_components: data.address,
        }
      }
    });

    handleSignUpResult(signUpData, supabaseError, data.email, donorForm.setError);
  }

  async function handleNgoSubmit(data: NgoForm) {
    const addressString = data.address.formatted;
    const isVerifiedNgo = /^NGO-REG009\d{5}$/.test(data.reg.trim());

    const { data: signUpData, error: supabaseError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: "ngo",
          organization_name: data.org,
          registration_number: data.reg,
          phone: data.phone,
          address: addressString,
          address_components: data.address,
          is_verified: isVerifiedNgo,
        }
      }
    });

    handleSignUpResult(signUpData, supabaseError, data.email, ngoForm.setError);
  }

  function handleSignUpResult(signUpData: any, supabaseError: any, email: string, setError: any) {
    if (supabaseError) {
      const msg = supabaseError.message.toLowerCase();
      if (msg.includes("email")) {
        setError("email", { message: supabaseError.message });
      } else {
        toast.error(supabaseError.message);
      }
      return;
    }

    if (signUpData.user && !signUpData.session) {
      setRegisteredEmail(email);
      setEmailSent(true);
      toast.success("Check your email to confirm your account!");
    } else {
      toast.success("Account created successfully!");
      navigate({ to: tab === "donor" ? "/donor/dashboard" : "/ngo/dashboard" });
    }
  }

  if (emailSent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm text-center">
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
          <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            We sent a confirmation link to <span className="font-medium text-foreground">{registeredEmail}</span>.
            Please confirm your email address to activate your account and access the dashboard.
          </p>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-block w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">SurplusLink</h1>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-md bg-secondary p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setTab("donor");
              donorForm.clearErrors();
            }}
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
            onClick={() => {
              setTab("ngo");
              ngoForm.clearErrors();
            }}
            className={`rounded py-1.5 transition ${
              tab === "ngo"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            NGO
          </button>
        </div>

        <form onSubmit={tab === "donor" ? donorForm.handleSubmit(handleDonorSubmit) : ngoForm.handleSubmit(handleNgoSubmit)} noValidate className="space-y-4">
          {tab === "donor" ? (
            <DonorFields
              control={donorForm.control}
              errors={donorForm.formState.errors}
            />
          ) : (
            <NgoFields
              control={ngoForm.control}
              errors={ngoForm.formState.errors}
            />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Creating Account…" : "Create Account"}
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
  control: Control<DonorForm>;
  errors: FieldErrors<DonorForm>;
};

function DonorFields({ control, errors }: DonorProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Field
              label="Business Name"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="Fresh Market"
              error={errors.name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <ComboField
              label="Business Type"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={BUSINESS_TYPES}
              placeholder="Grocery, Bakery…"
              error={errors.type?.message}
            />
          )}
        />
      </div>

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Field
            label="Email Address"
            type="email"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder="contact@example.com"
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <Field
            label="Phone Number"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder="+27 "
            error={errors.phone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="address"
        render={({ field }) => (
          <div>
            <AddressAutocomplete
              value={field.value}
              onChange={field.onChange}
            />
            {errors.address?.formatted && (
              <p className="mt-1 text-[11px] text-destructive leading-tight">
                {errors.address.formatted.message}
              </p>
            )}
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <PasswordField
              label="Password"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <PasswordField
              label="Confirm Password"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />
      </div>
    </>
  );
}

type NgoProps = {
  control: Control<NgoForm>;
  errors: FieldErrors<NgoForm>;
};

function NgoFields({ control, errors }: NgoProps) {
  return (
    <>
      <Controller
        control={control}
        name="org"
        render={({ field }) => (
          <Field
            label="Organisation Name"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder="Hope Shelter"
            error={errors.org?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="reg"
        render={({ field }) => (
          <Field
            label="NGO Registration Number"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder="NGO-REG00912345"
            error={errors.reg?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Field
            label="Email Address"
            type="email"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder="contact@ngo.org"
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <Field
            label="Phone Number"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder="+27..."
            error={errors.phone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="address"
        render={({ field }) => (
          <div>
            <AddressAutocomplete
              value={field.value}
              onChange={field.onChange}
            />
            {errors.address?.formatted && (
              <p className="mt-1 text-[11px] text-destructive leading-tight">
                {errors.address.formatted.message}
              </p>
            )}
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <PasswordField
              label="Password"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <PasswordField
              label="Confirm Password"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />
      </div>
    </>
  );
}