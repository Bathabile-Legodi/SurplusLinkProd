import { supabase } from "@/lib/supabase";

export type DonationItem = {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  expiry: string;
};

export type RecentDonation = {
  id: number;
  batchId: string;
  category: string;
  time: string;
  status: string;
  submittedAt: string;
  items: DonationItem[];
  collectionDeadline?: string; // ISO timestamp for collection deadline
};

const CURRENT_BATCH_KEY = "surpluslink-current-donation-batch";
//const RECENT_DONATIONS_KEY = "surpluslink-recent-donations";
//const LAST_SUBMITTED_BATCH_KEY = "surpluslink-last-submitted-batch-id";
//const MAX_BATCH_ID = 999;

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "An unexpected error occurred.";
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function formatDonationTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const clock = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
  if (sameDay) return `Today, ${clock}`;
  if (isYesterday) return `Yesterday, ${clock}`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
}

function getEarliestExpiry(items: DonationItem[]): Date | null {
  const expiries = items
    .map((item) => new Date(item.expiry))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (expiries.length === 0) return null;

  return new Date(Math.min(...expiries.map((date) => date.getTime())));
}

function pruneExpiredRecentDonations(donations: RecentDonation[]): RecentDonation[] {
  const now = new Date();

  return donations.filter((donation) => {
    const earliestExpiry = getEarliestExpiry(donation.items);
    if (!earliestExpiry) {
      return true;
    }
    return earliestExpiry.getTime() > now.getTime();
  });
}

function mapItemRow(row: any): DonationItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: String(row.quantity),
    unit: row.unit,
    expiry: row.expiry,
  };
}

function mapBatchRow(row: any): RecentDonation {
  return {
    id: row.display_id,
    batchId: row.id,
    category: row.batch_type,
    time: formatDonationTime(row.submitted_at),
    status: row.status,
    submittedAt: row.submitted_at,
    collectionDateTime: row.collection_datetime,
    items: (row.donation_items ?? []).map(mapItemRow),
  };
}

export function loadCurrentBatch(): DonationItem[] {
  if (typeof window === "undefined") return [];
  return safeParse<DonationItem[]>(window.localStorage.getItem(CURRENT_BATCH_KEY), []);
}

export function saveCurrentBatch(items: DonationItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_BATCH_KEY, JSON.stringify(items));
}

export function clearCurrentBatch() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CURRENT_BATCH_KEY);
}

export function makeItemId() {
  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

<<<<<<< HEAD
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 9)
=======
  return prunedDonations;
}

export function saveRecentDonations(donations: RecentDonation[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENT_DONATIONS_KEY, JSON.stringify(donations));
}

export function getLastSubmittedBatchId(): number | null {
  if (typeof window === "undefined") return null;

  const parsed = normalizeBatchId(window.localStorage.getItem(LAST_SUBMITTED_BATCH_KEY));
  return parsed ?? null;
}

export function setLastSubmittedBatchId(id: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_SUBMITTED_BATCH_KEY, String(id));
}

export function submitDonationBatch(items: DonationItem[], collectionDeadline?: string) {
  const submittedAt = new Date().toISOString();
  const id = createDonationId();
  const category = items.length === 1 ? items[0].category : "Mixed Donation";
  const donation: RecentDonation = {
    id,
    category,
    time: formatDonationTime(submittedAt),
    status: "Pending",
    submittedAt,
    items,
    collectionDeadline,
  };
  const allRecent = [donation, ...loadRecentDonations()].slice(0, 10);
  saveRecentDonations(allRecent);
  setLastSubmittedBatchId(id);
  clearCurrentBatch();
  return donation;
}

export function updateDonationStatus(id: number, status: string) {
  const donations = loadRecentDonations();
  const updated = donations.map((donation) =>
    donation.id === id ? { ...donation, status } : donation,
>>>>>>> 02760936bc800240cdd0cbd5683c89c117c833c3
  );
}

export async function submitDonationBatch(
  items: DonationItem[],
  collectionDateTime: string,
): Promise<RecentDonation> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("You must be signed in to submit a donation.");
  }

  const { data: batchRow, error: batchError } = await supabase
    .from("donation_batches")
    .insert({
      donor_id: userData.user.id,
      batch_type: items.length > 1 ? "Mixed Donation" : items[0]?.category ?? "Donation",
      collection_datetime: collectionDateTime,
    })
    .select()
    .single();

  if (batchError || !batchRow) {
    throw batchError ?? new Error("Failed to create donation batch");
  }

  const itemRows = items.map((item) => ({
    batch_id: batchRow.id,
    name: item.name,
    category: item.category,
    quantity: Number(item.quantity),
    unit: item.unit,
    expiry: item.expiry,
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from("donation_items")
    .insert(itemRows)
    .select();

  if (itemsError) throw itemsError;

  clearCurrentBatch();
  return mapBatchRow({ ...batchRow, donation_items: insertedItems });
}

export async function loadRecentDonations(): Promise<RecentDonation[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];

  const { data, error } = await supabase
    .from("donation_batches")
    .select("*, donation_items(*)")
    .eq("donor_id", userData.user.id)
    .order("submitted_at", { ascending: false })
    .limit(10);

  if (error || !data) return [];

  return pruneExpiredRecentDonations(data.map(mapBatchRow));
}

export async function updateDonationStatus(displayId: number, status: string): Promise<RecentDonation | null> {
  const { data, error } = await supabase
    .from("donation_batches")
    .update({ status })
    .eq("display_id", displayId)
    .select("*, donation_items(*)")
    .single();

  if (error || !data) return null;
  return mapBatchRow(data);
}
