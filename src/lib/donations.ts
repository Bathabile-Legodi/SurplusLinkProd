export type DonationItem = {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  expiry: string;
};

export type RecentDonation = {
  id: number;
  category: string;
  time: string;
  status: string;
  submittedAt: string;
  items: DonationItem[];
};

const CURRENT_BATCH_KEY = "surpluslink-current-donation-batch";
const RECENT_DONATIONS_KEY = "surpluslink-recent-donations";
const LAST_SUBMITTED_BATCH_KEY = "surpluslink-last-submitted-batch-id";
const MAX_BATCH_ID = 999;

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeBatchId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && Number.isInteger(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return null;
}

function formatBatchId(id: number) {
  return `#${id.toString().padStart(3, "0")}`;
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

function readLastSubmittedBatchId(): number {
  if (typeof window === "undefined") return 0;

  const raw = window.localStorage.getItem(LAST_SUBMITTED_BATCH_KEY);
  const parsed = normalizeBatchId(raw);

  return parsed ?? 0;
}

function getNextBatchId(): number {
  const recentDonations = loadRecentDonations();
  const usedIds = new Set(recentDonations.map((donation) => donation.id));
  const lastSubmittedId = readLastSubmittedBatchId();

  if (lastSubmittedId > 0) {
    usedIds.add(lastSubmittedId);
  }

  for (let candidate = 1; candidate <= MAX_BATCH_ID; candidate += 1) {
    if (!usedIds.has(candidate)) {
      return candidate;
    }
  }

  return 1;
}

export function createDonationId() {
  const nextId = getNextBatchId();

  if (typeof window !== "undefined") {
    window.localStorage.setItem(LAST_SUBMITTED_BATCH_KEY, String(nextId));
  }

  return nextId;
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

  const donations = safeParse<RecentDonation[]>(window.localStorage.getItem(RECENT_DONATIONS_KEY), []);
  const normalizedDonations = donations.map((donation) => ({
    ...donation,
    id: normalizeBatchId(donation.id) ?? 0,
  }));
  const prunedDonations = pruneExpiredRecentDonations(normalizedDonations);

  if (prunedDonations.length !== donations.length) {
    window.localStorage.setItem(RECENT_DONATIONS_KEY, JSON.stringify(prunedDonations));
  }

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

export function updateDonationStatus(id: number, status: string) {
  const donations = loadRecentDonations();
  const updated = donations.map((donation) =>
    donation.id === id ? { ...donation, status } : donation,
  );
  saveRecentDonations(updated);
  return updated.find((donation) => donation.id === id) ?? null;
}
