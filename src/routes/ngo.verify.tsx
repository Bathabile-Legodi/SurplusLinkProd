import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader, ngoNav } from "@/components/AppHeader";
import { useState } from "react";

// 1. Explicitly register the path with TanStack Router
export const Route = createFileRoute("/ngo/verify")({
  head: () => ({ meta: [{ title: "Verify NGO Profiles — SurplusLink" }] }),
  component: NgoVerifyPage,
});

// 2. Clear type definition for NGO Registrations
interface NgoRegistrationItem {
  id: string;
  ngoName: string;
  cipcNumber: string;
  documents: string;
  submissionDate: string;
}

const pendingNgos: NgoRegistrationItem[] = [
  { 
    id: "NGO-432", 
    ngoName: "Bontle Community Kitchen", 
    cipcNumber: "2018/432109/08", 
    documents: "NPO Certificate & Tax Clearance.pdf", 
    submissionDate: "Submitted • Today, 2:15 PM" 
  },
  { 
    id: "NGO-876", 
    ngoName: "Siyakhula Youth Care", 
    cipcNumber: "2021/876543/08", 
    documents: "Section 18A Status Proof.pdf", 
    submissionDate: "Submitted • Yesterday" 
  },
  { 
    id: "NGO-123", 
    ngoName: "Ubuntu Food Share", 
    cipcNumber: "2015/123456/08", 
    documents: "Constitution & ID Copies.pdf", 
    submissionDate: "Submitted • 3 days ago" 
  },
];

function NgoVerifyPage() {
  const [registrations, setRegistrations] = useState<NgoRegistrationItem[]>(pendingNgos);

  const handleAction = (id: string, action: "Approved" | "Rejected") => {
    setRegistrations(prev => prev.filter(item => item.id !== id));
    alert(`${action} successfully! Organization status updated.`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader nav={ngoNav} userLabel="HS" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-xl font-semibold">NGO  Verification</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review legal registration documents and approve new organizations to join the SurplusLink network.
        </p>

        <h2 className="mt-8 text-xs uppercase tracking-wide text-muted-foreground">
          Pending Profile Applications ({registrations.length})
        </h2>
        
        <ul className="mt-2 space-y-3">
          {registrations.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl bg-card p-4">
              <p className="text-sm text-muted-foreground italic">
                All pending NGO registration profiles have been verified.
              </p>
              <Link to="/ngo/dashboard" className="mt-3 inline-block text-xs text-primary hover:underline">
                Return to Dashboard
              </Link>
            </div>
          ) : (
            registrations.map((ngo) => (
              <li key={ngo.id} className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{ngo.ngoName}</p>
                    <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {ngo.id}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    CIPC: <span className="font-mono text-foreground/90">{ngo.cipcNumber}</span> • {ngo.submissionDate}
                  </p>
                  <p className="text-xs text-muted-foreground/80 mt-1.5 bg-muted/40 px-2 py-1 rounded inline-flex items-center gap-1">
                    📄 {ngo.documents}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(ngo.id, "Approved")}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Verify & Approve
                  </button>
                  <button
                    onClick={() => handleAction(ngo.id, "Rejected")}
                    className="rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </main>
    </div>
  );
}