import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Phone,
  Copy,
  ExternalLink,
  MessageSquare,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { AppHeader, ngoNav } from "@/components/AppHeader";

export const Route = createFileRoute("/ngo/collection/instructions/$id")({
  head: () => ({
    meta: [{ title: "Collection Instructions — SurplusLink" }],
  }),
  component: CollectionInstructions,
});

function CollectionInstructions() {
  const { id } = Route.useParams();

  const batchId = `#${id.toUpperCase().slice(0, 8)}`;

  const contactName = "David M.";
  const contactRole = "Logistics Supervisor";
  const phone = "+27 82 123 4567";

  const gateCode = "#8842-B";

  const loadingBay =
    "Enter Gate 3, proceed to Bay 4 (Cold Storage)";

  const pickupWindow =
    "Pickup strictly between 13:00 - 14:30 Today";

 const verificationPin = "4829";

 const [copied, setCopied] = useState("");

function copy(text: string, message: string) {
  const textArea = document.createElement("textarea");

  textArea.value = text;
  document.body.appendChild(textArea);

  textArea.select();
  document.execCommand("copy");

  document.body.removeChild(textArea);

  setCopied(message);
  setTimeout(() => {
  setCopied("");
}, 2000);
}

  

  function openMaps() {
    window.open(
      "https://maps.google.com",
      "_blank"
    );
  }

  function sendDriver() {
    const message = `
Collection Instructions

Batch: ${batchId}

Contact: ${contactName}
Phone: ${phone}

Gate Code: ${gateCode}

Loading Bay:
${loadingBay}

Pickup Window:
${pickupWindow}

Verification PIN:
${verificationPin}
`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={ngoNav} userLabel="HS" />

      <main className="mx-auto max-w-6xl px-6 py-10">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h1 className="text-4xl font-bold">
              Collection Instructions — Batch {batchId}
            </h1>


          </div>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={sendDriver}
              className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-5 py-3 transition hover:bg-muted"
            >
              <MessageSquare className="h-5 w-5" />
              Send to Driver (WhatsApp/SMS)
            </button>

            <button
              onClick={openMaps}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-3 text-primary-foreground transition hover:opacity-90"
            >
              <MapPin className="h-5 w-5" />
              Open in Google Maps

              <ExternalLink className="h-4 w-4" />
            </button>

          </div>

        </div>

        {/* Donation Summary */}

<div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">

  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

    <div>

      <p className="text-sm text-muted-foreground">
        Batch ID
      </p>

      <p className="mt-1 text-lg font-semibold">
        {batchId}
      </p>

    </div>

    <div>

      <p className="text-sm text-muted-foreground">
        Donor
      </p>

      <p className="mt-1 text-lg font-semibold">
        FreshMart Fourways
      </p>

    </div>

    <div>

      <p className="text-sm text-muted-foreground">
        Food Type
      </p>

      <p className="mt-1 text-lg font-semibold">
        Fresh Produce
      </p>

    </div>

    <div>

      <p className="text-sm text-muted-foreground">
        Pickup Time
      </p>

      <p className="mt-1 text-lg font-semibold">
        Today • 13:00–14:30
      </p>

    </div>

  </div>

</div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
                  {/* Loading Bay & Site Access */}

          <div className="rounded-2xl border bg-card p-8 shadow-sm">

            <h2 className="mb-6 text-2xl font-semibold">
              Loading Bay & Site Access
            </h2>

            <div className="space-y-5">

              <div className="rounded-xl border p-5">

                <p className="text-sm text-muted-foreground">
                  Contact
                </p>

                <div className="mt-2 flex items-center justify-between">

                  <div>

                    <p className="font-semibold">
                      {contactName}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {contactRole}
                    </p>

                  </div>

              <div className="flex items-center gap-2">
  {copied === "Phone copied!" && (
    <span className="text-sm font-medium text-emerald-600">
      ✓ Copied!
    </span>
  )}

  <button
    onClick={() => copy(phone, "Phone copied!")}
    className="cursor-pointer rounded-lg border p-2 transition hover:bg-muted"
  >
    <Copy className="h-4 w-4" />
  </button>
</div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm">

                  <Phone className="h-4 w-4 text-primary" />

                  {phone}

                </div>

              </div>

              

              <div className="rounded-xl border p-5">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-muted-foreground">
                      Loading Bay
                    </p>

                    <p className="mt-1 font-semibold">
                      {loadingBay}
                    </p>

                  </div>

                <div className="flex items-center gap-2">
  {copied === "Loading Bay copied!" && (
    <span className="text-sm font-medium text-emerald-600">
      ✓ Copied!
    </span>
  )}

  <button
    onClick={() => copy(loadingBay, "Loading Bay copied!")}
    className="cursor-pointer rounded-lg border p-2 transition hover:bg-muted"
  >
    <Copy className="h-4 w-4" />
  </button>
</div>

                </div>

              </div>

            </div>

          </div>

          {/* Collection Progress */}

          <div className="rounded-2xl border bg-card p-8 shadow-sm">

            <h2 className="mb-6 text-2xl font-semibold">
              Collection Progress
            </h2>

            <div className="space-y-6">

              <div className="flex items-start gap-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-full border">
                  1
                </div>

                <div>

                  <p className="font-semibold">
                    En Route
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Driver is travelling to the pickup location.
                  </p>

                </div>

              </div>

              <div className="ml-5 h-10 w-0.5 bg-border"></div>

              <div className="flex items-start gap-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>

                <div>

                  <p className="font-semibold">
                    At Site
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Meet the donor contact and verify collection.
                  </p>

                </div>

              </div>

              <div className="ml-5 h-10 w-0.5 bg-border"></div>

              <div className="flex items-start gap-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-full border">
                  3
                </div>

                <div>

                  <p className="font-semibold">
                    Loaded & Verified
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Confirm collection after loading is complete.
                  </p>

                </div>

              </div>

            </div>

          </div>

                    {/* Pickup Information */}

          <div className="mt-6 rounded-2xl border bg-card p-8 shadow-sm lg:col-span-2">

            <div className="grid gap-8 lg:grid-cols-2">

              <div>

                <h2 className="text-2xl font-semibold">
                  Pickup Information
                </h2>

                <div className="mt-6 space-y-5">

                  <div className="rounded-xl border p-5">

                    <p className="text-sm text-muted-foreground">
                      Pickup Window
                    </p>

                    <p className="mt-2 font-semibold">
                      {pickupWindow}
                    </p>

                  </div>


                </div>

              </div>

              <div>

  <h2 className="text-2xl font-semibold">
    Verification PIN
  </h2>

  <p className="mt-2 text-sm text-muted-foreground">
    Provide this PIN to the donor before collecting the donation.
  </p>

  <div className="mt-6 rounded-2xl border p-8">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-sm text-muted-foreground">
          Collection PIN
        </p>

        <p className="mt-3 text-5xl font-bold tracking-[0.6rem]">
          4829
        </p>

      </div>

      <div className="flex items-center gap-2">
  {copied === "PIN copied!" && (
    <span className="text-sm font-medium text-emerald-600">
      ✓ Copied!
    </span>
  )}

  <button
    onClick={() => copy(verificationPin, "PIN copied!")}
    className="cursor-pointer rounded-lg border p-2 transition hover:bg-muted"
  >
    <Copy className="h-4 w-4" />
  </button>
</div>

    </div>

    <p className="mt-6 text-sm text-muted-foreground">
      The donor will ask for this PIN before handing over the donation.
    </p>

  </div>

</div>

           

            </div>

          </div>

        </div>

        <div className="mt-10 flex justify-end">

          <button
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 font-semibold text-white transition hover:bg-emerald-700 hover:shadow-lg"
          >
            <CheckCircle2 className="h-5 w-5" />
            Complete Collection
          </button>

        </div>

      </main>

    </div>
  );
}


