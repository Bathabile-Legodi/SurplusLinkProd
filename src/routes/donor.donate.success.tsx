import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader, donorNav } from "@/components/AppHeader";
<<<<<<< HEAD
=======
import { getLastSubmittedBatchId, loadRecentDonations } from "@/lib/donations";
>>>>>>> 02760936bc800240cdd0cbd5683c89c117c833c3

function formatBatchId(id: number) {
  return `#${id.toString().padStart(3, "0")}`;
}

export const Route = createFileRoute("/donor/donate/success")({
  validateSearch: (search: Record<string, unknown>): { batchId: number | null } => {
    const parsed = Number(search.batchId);
    return { batchId: Number.isFinite(parsed) ? parsed : null };
  },
  head: () => ({ meta: [{ title: "Donation Submitted — SurplusLink" }] }),
  component: SuccessPage,
});

function SuccessPage() {
<<<<<<< HEAD
  const { batchId } = Route.useSearch();
=======
  const [submittedBatchId, setSubmittedBatchId] = useState<number>(1);
  const [deadline, setDeadline] = useState<string | null>(null);

  useEffect(() => {
    const id = getLastSubmittedBatchId();
    if (id !== null) {
      setSubmittedBatchId(id);
    }
  }, []);
>>>>>>> 02760936bc800240cdd0cbd5683c89c117c833c3

  useEffect(() => {
    const id = getLastSubmittedBatchId();
    if (id === null) return;
    const donations = loadRecentDonations();
    const found = donations.find((d) => d.id === id);
    if (found && found.collectionDeadline) {
      try {
        const dt = new Date(found.collectionDeadline);
        setDeadline(dt.toLocaleString());
      } catch {
        setDeadline(found.collectionDeadline ?? null);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={donorNav} userLabel="FM" /> 
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <span className="text-2xl text-[color:var(--success)]">✓</span>
        </div>
        <h1 className="mt-6 text-xl font-semibold">Donation Successfully Submitted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {batchId !== null ? (
            <>Your batch <b>{formatBatchId(batchId)}</b> has been added to our network. Verified NGOs nearby have been notified and can claim it.</>
          ) : (
            <>Your donation has been added to our network. Verified NGOs nearby have been notified and can claim it.</>
          )}
        </p>
        {deadline ? (
          <p className="mt-2 text-sm text-muted-foreground">Collection Deadline: <b>{deadline}</b></p>
        ) : null}
        <Link
          to="/donor/dashboard"
          className="mt-8 inline-block rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Return to Dashboard
        </Link>
      </main>
    </div>
  );
}