import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Phone,
  Copy,
  ExternalLink,
  MessageSquare,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/ngo/collection/instructions/$id")({
  beforeLoad: () => requireRole("ngo"),
  head: () => ({
    meta: [{ title: "Collection Instructions — SurplusLink" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    from: (search.from as string | undefined) ?? undefined,
  }),
  component: CollectionInstructions,
});

interface BatchSummary {
  batch_type: string;
  donor: string;
  collection_datetime: string | null;
}

function CollectionInstructions() {
  const { id } = Route.useParams();
  const { from } = Route.useSearch();
  const { initials } = useAuth();
  const navigate = useNavigate();
  const showConfirmButton = from !== 'claims';

  const batchId = `#${id.toUpperCase().slice(0, 8)}`;
  const contactName = "David M.";
  const contactRole = "Logistics Supervisor";
  const phone = "+27 82 123 4567";
  const gateCode = "#8842-B";
  const loadingBay = "Enter Gate 3, proceed to Bay 4 (Cold Storage)";

  const [batch, setBatch] = useState<BatchSummary | null>(null);
  const [copied, setCopied] = useState("");
  
  // Generate a random 4-digit verification PIN once on mount
  const [verificationPin] = useState(() => 
    Math.floor(1000 + Math.random() * 9000).toString()
  );

  useEffect(() => {
    async function fetchBatch() {
      const { data, error } = await supabase
        .from("donation_batches")
        .select(`
          batch_type,
          collection_datetime,
          donors (
            organization_name
          )
        `)
        .eq("id", id)
        .single();

      if (!error && data) {
        const raw = data as any;
        setBatch({
          batch_type: raw.batch_type || "Surplus Food",
          donor: raw.donors?.organization_name || "Anonymous Donor",
          collection_datetime: raw.collection_datetime,
        });
      }
    }

    fetchBatch();
  }, [id]);

  // Format the pickup window using the database collection_datetime
  const pickupWindow = batch?.collection_datetime
    ? new Date(batch.collection_datetime).toLocaleString("en-ZA", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  }

  function openMaps() {
    window.open("https://maps.google.com", "_blank");
  }

  function sendDriver() {
    const message = `Collection Instructions\n\nBatch: ${batchId}\nContact: ${contactName}\nPhone: ${phone}\n\nGate Code: ${gateCode}\nLoading Bay: ${loadingBay}\nPickup Window: ${pickupWindow}\nVerification PIN: ${verificationPin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader nav={ngoNav} userLabel={initials} />
      <main className="mx-auto flex-1 w-full max-w-3xl px-6 py-10">

        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Collection Instructions
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Batch <span className="font-medium text-foreground">{batchId}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={sendDriver}
              className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-4 text-sm font-medium hover:bg-secondary transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Send to Driver
            </button>
            <button
              type="button"
              onClick={openMaps}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Open in Maps
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <section className="mb-6 rounded-xl border bg-card">
          <div className="grid divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {[
              { label: "Batch ID", value: batchId },
              { label: "Donor", value: batch?.donor ?? "Loading…" },
              { label: "Food Type", value: batch?.batch_type ?? "Loading…" },
              { label: "Pickup Window", value: pickupWindow },
            ].map(({ label, value }) => (
              <div key={label} className="px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Loading Bay & Site Access */}
          <section className="rounded-xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="text-sm font-semibold">Loading Bay &amp; Site Access</h2>
            </div>
            <div className="space-y-3 p-5">

              {/* Contact */}
              <div className="rounded-lg bg-secondary/60 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{contactName}</p>
                    <p className="text-xs text-muted-foreground">{contactRole}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      {phone}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {copied === "Phone copied!" && (
                      <span className="text-xs font-medium text-[color:var(--success)]">✓ Copied</span>
                    )}
                    <button
                      type="button"
                      onClick={() => copy(phone, "Phone copied!")}
                      className="rounded-md border p-1.5 hover:bg-secondary transition-colors"
                      title="Copy phone number"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Gate code */}
              <div className="rounded-lg bg-secondary/60 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Gate Code
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">{gateCode}</p>
                  <div className="flex items-center gap-2">
                    {copied === "Gate code copied!" && (
                      <span className="text-xs font-medium text-[color:var(--success)]">✓ Copied</span>
                    )}
                    <button
                      type="button"
                      onClick={() => copy(gateCode, "Gate code copied!")}
                      className="rounded-md border p-1.5 hover:bg-secondary transition-colors"
                      title="Copy gate code"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Loading Bay */}
              <div className="rounded-lg bg-secondary/60 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Loading Bay
                </p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{loadingBay}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    {copied === "Loading bay copied!" && (
                      <span className="text-xs font-medium text-[color:var(--success)]">✓ Copied</span>
                    )}
                    <button
                      type="button"
                      onClick={() => copy(loadingBay, "Loading bay copied!")}
                      className="rounded-md border p-1.5 hover:bg-secondary transition-colors"
                      title="Copy loading bay"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Collection Progress */}
          <section className="rounded-xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="text-sm font-semibold">Collection Progress</h2>
            </div>
            <div className="p-5">
              <ol className="space-y-1">
                {[
                  {
                    step: 1,
                    label: "En Route",
                    desc: "Driver is travelling to the pickup location.",
                    active: false,
                  },
                  {
                    step: 2,
                    label: "At Site",
                    desc: "Meet the donor contact and verify collection.",
                    active: true,
                  },
                  {
                    step: 3,
                    label: "Loaded & Verified",
                    desc: "Confirm collection after loading is complete.",
                    active: false,
                  },
                ].map(({ step, label, desc, active }, i, arr) => (
                  <li key={step}>
                    <div className="flex items-start gap-4 py-2">
                      <div
                        className={[
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "border text-muted-foreground",
                        ].join(" ")}
                      >
                        {step}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="ml-[15px] h-5 w-0.5 bg-border" />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Pickup Information */}
          <section className="rounded-xl border bg-card lg:col-span-2">
            <div className="border-b px-5 py-4">
              <h2 className="text-sm font-semibold">Pickup Information &amp; Verification PIN</h2>
            </div>
            <div className="grid gap-6 p-5 sm:grid-cols-2">

              {/* Pickup window */}
              <div className="rounded-lg bg-secondary/60 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Pickup Window
                </p>
                <p className="mt-2 text-sm font-semibold">{pickupWindow}</p>
              </div>

              {/* Verification PIN */}
              <div className="rounded-lg bg-secondary/60 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Verification PIN
                </p>
                <p className="mb-1 mt-0.5 text-xs text-muted-foreground">
                  Provide this to the donor before collecting.
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-4xl font-bold tracking-[0.5rem] text-foreground">
                    {verificationPin}
                  </p>
                  <div className="flex items-center gap-2">
                    {copied === "PIN copied!" && (
                      <span className="text-xs font-medium text-[color:var(--success)]">✓ Copied</span>
                    )}
                    <button
                      type="button"
                      onClick={() => copy(verificationPin, "PIN copied!")}
                      className="rounded-md border p-1.5 hover:bg-secondary transition-colors"
                      title="Copy PIN"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </section>

        </div>

        {/* Confirm collection CTA — hidden when opened from the claims list */}
        {showConfirmButton && (
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate({ to: "/ngo/claims" })}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Collection
            </button>
          </div>
        )}

      </main>
    </div>
  );
}