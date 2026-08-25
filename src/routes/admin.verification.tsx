import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-guard";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/verification")({
  beforeLoad: () => requireAuth(),
  head: () => ({ meta: [{ title: "Admin Verification — SurplusLink" }] }),
  component: AdminVerificationPage,
});

interface NGO {
  id: string;
  name: string;
  npo_number: string;
  contact_email: string;
  status: string;
}

function AdminVerificationPage() {
  const [pendingNGOs, setPendingNGOs] = useState<NGO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingNGOs();
  }, []);

  const fetchPendingNGOs = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("role", "ngo")
        .eq("status", "pending");

      if (error) throw error;
      setPendingNGOs(data || []);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching pending NGOs:", msg);
      toast.error("Failed to load pending NGOs.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (id: string, newStatus: "verified" | "rejected") => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setPendingNGOs((prev) => prev.filter((ngo) => ngo.id !== id));
      toast.success(`NGO ${newStatus === "verified" ? "approved" : "rejected"} successfully.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error updating status to ${newStatus}:`, msg);
      toast.error("Failed to update NGO status. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">NGO Verification Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and approve pending NGO registrations.</p>

        {isLoading ? (
          <div className="mt-8 flex justify-center">
            <p className="text-muted-foreground">Loading queue...</p>
          </div>
        ) : pendingNGOs.length === 0 ? (
          <div className="mt-8 rounded-xl border bg-card p-8 text-center">
            <p className="text-muted-foreground">No pending NGOs to review. You're all caught up!</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4">
            {pendingNGOs.map((ngo) => (
              <div key={ngo.id} className="flex items-center justify-between rounded-xl border bg-card p-5">
                <div>
                  <h3 className="text-lg font-semibold">{ngo.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    NPO Number: <span className="font-mono text-foreground">{ngo.npo_number || 'N/A'}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Contact: {ngo.contact_email}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview(ngo.id, "verified")}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(ngo.id, "rejected")}
                    className="rounded-md border border-destructive bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
