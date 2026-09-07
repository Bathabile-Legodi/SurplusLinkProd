import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Phone,
  Copy,
  ExternalLink,
  MessageSquare,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { AppHeader, ngoNav } from "@/components/AppHeader"; // kept for type compat — unused after migration

import { ngoSidebarNav } from "@/lib/nav";
import { supabase } from "@/lib/supabase";

import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/ngo/collection/instructions/$id")({
  
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
          donors!donor_id (
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
    <>
      <main className="mx-auto flex-1 w-full max-w-4xl px-6 py-10">

        <Link
          to="/ngo/claims"
          className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          &larr; Back to Claims
        </Link>

        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Collection Instructions
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Batch <span className="font-bold text-foreground">{batchId}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={sendDriver}
              className="inline-flex h-10 items-center gap-2 rounded-xl glass px-5 text-sm font-bold text-foreground shadow-sm hover:bg-white/40 transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              Send to Driver
            </button>
            <button
              type="button"
              onClick={openMaps}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 hover:-translate-y-0.5 transition-all"
            >
              <MapPin className="h-4 w-4" />
              Open in Maps
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <section className="mb-8 rounded-3xl glass shadow-sm">
          <div className="grid divide-y divide-border/40 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {[
              { label: "Batch ID", value: batchId },
              { label: "Donor", value: batch?.donor ?? "Loading…" },
              { label: "Food Type", value: batch?.batch_type ?? "Loading…" },
              { label: "Pickup Window", value: pickupWindow },
            ].map(({ label, value }) => (
              <div key={label} className="px-6 py-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1.5 text-sm font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Main grid */}
        <div className="grid gap-8 lg:grid-cols-2">

          {/* Loading Bay & Site Access */}
          <section className="rounded-3xl glass shadow-sm">
            <div className="border-b border-border/40 px-6 py-5">
              <h2 className="text-base font-bold tracking-tight">Loading Bay &amp; Site Access</h2>
            </div>
            <div className="space-y-4 p-6">

              {/* Contact */}
              <div className="rounded-2xl glass bg-white/40 p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Contact
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{contactName}</p>
                    <p className="text-xs font-medium text-muted-foreground">{contactRole}</p>
                    <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary" />
                      {phone}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {copied === "Phone copied!" && (
                      <span className="text-xs font-bold text-emerald-600">✓ Copied</span>
                    )}
                    <button
                      type="button"
                      onClick={() => copy(phone, "Phone copied!")}
                      className="rounded-xl border border-border/40 bg-white p-2 hover:bg-secondary hover:shadow-sm transition-all"
                      title="Copy phone number"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Gate code */}
              <div className="rounded-2xl glass bg-white/40 p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Gate Code
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-bold">{gateCode}</p>
                  <div className="flex items-center gap-3">
                    {copied === "Gate code copied!" && (
                      <span className="text-xs font-bold text-emerald-600">✓ Copied</span>
                    )}
                    <button
                      type="button"
                      onClick={() => copy(gateCode, "Gate code copied!")}
                      className="rounded-xl border border-border/40 bg-white p-2 hover:bg-secondary hover:shadow-sm transition-all"
                      title="Copy gate code"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Loading Bay */}
              <div className="rounded-2xl glass bg-white/40 p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Loading Bay
                </p>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold">{loadingBay}</p>
                  <div className="flex shrink-0 items-center gap-3">
                    {copied === "Loading bay copied!" && (
                      <span className="text-xs font-bold text-emerald-600">✓ Copied</span>
                    )}
                    <button
                      type="button"
                      onClick={() => copy(loadingBay, "Loading bay copied!")}
                      className="rounded-xl border border-border/40 bg-white p-2 hover:bg-secondary hover:shadow-sm transition-all"
                      title="Copy loading bay"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Collection Progress */}
          <section className="rounded-3xl glass shadow-sm">
            <div className="border-b border-border/40 px-6 py-5">
              <h2 className="text-base font-bold tracking-tight">Collection Progress</h2>
            </div>
            <div className="p-6">
              <ol className="space-y-2">
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
                    <div className="flex items-start gap-4 py-3">
                      <div
                        className={[
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-colors",
                          active
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : "border bg-white text-muted-foreground",
                        ].join(" ")}
                      >
                        {step}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                          {label}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="ml-[17px] h-6 w-[3px] rounded-full bg-border/60" />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Pickup Information */}
          <section className="rounded-3xl glass shadow-sm lg:col-span-2">
            <div className="border-b border-border/40 px-6 py-5">
              <h2 className="text-base font-bold tracking-tight">Pickup Information &amp; Verification PIN</h2>
            </div>
            <div className="grid gap-6 p-6 sm:grid-cols-2">

              {/* Pickup window */}
              <div className="rounded-2xl glass bg-white/40 p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Pickup Window
                </p>
                <p className="mt-3 text-base font-bold tracking-tight">{pickupWindow}</p>
              </div>

              {/* Verification PIN */}
              <div className="rounded-2xl glass bg-primary/5 border border-primary/10 p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                  Verification PIN
                </p>
                <p className="mb-2 mt-1 text-xs font-medium text-muted-foreground">
                  Provide this to the donor before collecting.
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-4xl font-black tracking-[0.5rem] text-primary">
                    {verificationPin}
                  </p>
                  <div className="flex items-center gap-3">
                    {copied === "PIN copied!" && (
                      <span className="text-xs font-bold text-emerald-600">✓ Copied</span>
                    )}
                    <button
                      type="button"
                      onClick={() => copy(verificationPin, "PIN copied!")}
                      className="rounded-xl border border-border/40 bg-white p-2 hover:bg-secondary hover:shadow-sm transition-all text-foreground"
                      title="Copy PIN"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </section>

        </div>

        {/* Confirm collection CTA — hidden when opened from the claims list */}
        {showConfirmButton && (
          <div className="mt-10 flex justify-end">
            <button
              type="button"
              onClick={() => navigate({ to: "/ngo/claims" })}
              className="inline-flex h-12 items-center gap-2.5 rounded-2xl bg-primary px-8 text-sm font-bold tracking-wide text-primary-foreground shadow-md hover:bg-primary/90 hover:-translate-y-0.5 transition-all"
            >
              <CheckCircle2 className="h-5 w-5" />
              Confirm Collection
            </button>
          </div>
        )}

      </main>
    </>
  );
}