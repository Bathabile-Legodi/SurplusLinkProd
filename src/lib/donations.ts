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
  collectionDateTime?: string;
  items: DonationItem[];
};

const CURRENT_BATCH_KEY = "surpluslink-current-donation-batch";

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
  // display_id is a generated sequence column; fall back to a stable
  // numeric hash of the UUID so formatBatchId never receives undefined.
  const displayId =
    typeof row.display_id === "number"
      ? row.display_id
      : Math.abs(
          String(row.id)
            .split("")
            .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 0)
        ) % 1000;
  return {
    id: displayId,
    batchId: row.id,
    category: row.batch_type ?? "Donation",
    time: row.submitted_at ? formatDonationTime(row.submitted_at) : "—",
    status: row.status ?? "Pending",
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

  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 9)
  );
}

export async function submitDonationBatch(
  items: DonationItem[],
  batchType: string,             // Changed parameter name to match review component usage
  collectionDateTime: string,
  submittedAt: string
): Promise<RecentDonation> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("You must be signed in to submit a donation.");
  }

  // Fallback category detection context if batchType text comes in blank
  let computedBatchType = batchType;
  if (!computedBatchType) {
    const allCategories = items.flatMap((item) =>
      item.category ? item.category.split(", ").map(c => c.trim()) : []
    );
    const uniqueCategories = Array.from(new Set(allCategories)).filter(Boolean);
    computedBatchType = uniqueCategories.length > 1
      ? "Mixed Donation"
      : uniqueCategories[0] || "Donation";
  }

  // 3. Perform parent batch insert
  const { data: batchRow, error: batchError } = await supabase
    .from("donation_batches")
    .insert({
      donor_id: userData.user.id,
      batch_type: computedBatchType,
      collection_datetime: collectionDateTime || null,
      submitted_at: submittedAt,
      status: 'unclaimed',
    })
    .select()
    .single();

  if (batchError || !batchRow) {
    throw batchError ?? new Error("Failed to create donation batch");
  }

  // 4. Map and batch save your line items
  const itemRows = items.map((item) => ({
    batch_id: batchRow.id,
    name: item.name,
    category: item.category,
    quantity: Number(item.quantity) || 0,
    unit: item.unit,
    expiry: item.expiry || null,
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

  if (error) throw error;
  if (!data) return [];

  // Show all recent batches regardless of item expiry — the donor
  // should always see their own submissions on the dashboard.
  return data.map(mapBatchRow);
}

export async function loadAllDonations(): Promise<RecentDonation[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];

  const { data, error } = await supabase
    .from("donation_batches")
    .select("*, donation_items(*)")
    .eq("donor_id", userData.user.id)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map(mapBatchRow);
}

export async function updateDonationStatus(identifier: string | number, status: string): Promise<RecentDonation | null> {
  const query = supabase
    .from("donation_batches")
    .update({ status })
    .select("*, donation_items(*)");

  const { data, error } = await (typeof identifier === "number"
    ? query.eq("display_id", identifier)
    : query.eq("id", identifier)
  ).single();

  if (error || !data) return null;
  return mapBatchRow(data);
}