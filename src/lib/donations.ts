export type DonationItem = {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  expiry: string;
};

export type RecentDonation = {
  id: string;
  category: string;
  time: string;
  status: string;
  submittedAt: string;
  items: DonationItem[];
};

const CURRENT_BATCH_KEY = "surpluslink-current-donation-batch";
const RECENT_DONATIONS_KEY = "surpluslink-recent-donations";
const LAST_SUBMITTED_BATCH_KEY = "surpluslink-last-submitted-batch-id";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function createDonationId() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DN-${stamp}-${suffix}`;
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

  if (sameDay) {
    return `Today, ${clock}`;
  }

  if (isYesterday) {
    return `Yesterday, ${clock}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
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

export function loadRecentDonations(): RecentDonation[] {
  if (typeof window === "undefined") return [];
  return safeParse<RecentDonation[]>(window.localStorage.getItem(RECENT_DONATIONS_KEY), []);
}

export function saveRecentDonations(donations: RecentDonation[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENT_DONATIONS_KEY, JSON.stringify(donations));
}

export function getLastSubmittedBatchId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_SUBMITTED_BATCH_KEY);
}

export function setLastSubmittedBatchId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_SUBMITTED_BATCH_KEY, id);
}

export function submitDonationBatch(items: DonationItem[]) {
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
  };
  const allRecent = [donation, ...loadRecentDonations()].slice(0, 10);
  saveRecentDonations(allRecent);
  setLastSubmittedBatchId(id);
  clearCurrentBatch();
  return donation;
}

export function updateDonationStatus(id: string, status: string) {
  const donations = loadRecentDonations();
  const updated = donations.map((donation) =>
    donation.id === id ? { ...donation, status } : donation,
  );
  saveRecentDonations(updated);
  return updated.find((donation) => donation.id === id) ?? null;
}
