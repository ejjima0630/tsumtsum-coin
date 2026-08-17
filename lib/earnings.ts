export const GACHA_COST = 30000;
export const UNLOCK_STEP = 2000;

export type Entry = {
  id: string;
  date: string; // YYYY-MM-DD
  balance: number;
  gachaCount: number;
  unlockSpent: number;
};

export type EntryInput = {
  date: string;
  balance: number;
  gachaCount: number;
  unlockSpent: number;
};

export type DailyEarning = {
  date: string; // the day the earning belongs to (the earlier entry's date)
  earned: number;
  spanDays: number; // 1 = normal, >1 = span across a gap in entries
  isNegative: boolean;
};

export type ChartPoint = {
  date: string;
  earned: number;
  estimated: boolean;
};

export type Summary = {
  currentBalance: number | null;
  monthEarned: number;
  dailyAverage: number;
  best: ChartPoint | null;
};

export function spentOn(entry: Pick<Entry, "gachaCount" | "unlockSpent">): number {
  return entry.gachaCount * GACHA_COST + entry.unlockSpent;
}

function sortByDate(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

// Formats a Date's *local* calendar date as YYYY-MM-DD. Deliberately avoids
// toISOString(), which converts to UTC first — in timezones ahead of UTC
// (e.g. JST) that silently rolls local midnight back to the previous day.
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(`${dateA}T00:00:00`);
  const b = new Date(`${dateB}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function computeDailyEarnings(entries: Entry[]): DailyEarning[] {
  const sorted = sortByDate(entries);
  const result: DailyEarning[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const earned = curr.balance - prev.balance + spentOn(curr);
    const spanDays = Math.max(1, daysBetween(prev.date, curr.date));
    result.push({ date: prev.date, earned, spanDays, isNegative: earned < 0 });
  }
  return result;
}

// Splits multi-day spans evenly so the chart can plot one point per calendar day.
export function expandForChart(dailyEarnings: DailyEarning[]): ChartPoint[] {
  const points: ChartPoint[] = [];
  for (const d of dailyEarnings) {
    if (d.spanDays <= 1) {
      points.push({ date: d.date, earned: d.earned, estimated: false });
      continue;
    }
    const perDay = d.earned / d.spanDays;
    const start = new Date(`${d.date}T00:00:00`);
    for (let i = 0; i < d.spanDays; i++) {
      const dt = new Date(start);
      dt.setDate(dt.getDate() + i);
      points.push({ date: toISODate(dt), earned: perDay, estimated: true });
    }
  }
  return points;
}

export function computeSummary(entries: Entry[]): Summary {
  const sorted = sortByDate(entries);
  const currentBalance = sorted.length > 0 ? sorted[sorted.length - 1].balance : null;

  const points = expandForChart(computeDailyEarnings(entries));

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthPoints = points.filter((p) => p.date.startsWith(monthPrefix));
  const monthEarned = monthPoints.reduce((sum, p) => sum + p.earned, 0);
  const dailyAverage = monthPoints.length > 0 ? monthEarned / monthPoints.length : 0;

  let best: ChartPoint | null = null;
  for (const p of points) {
    if (!best || p.earned > best.earned) best = p;
  }

  return { currentBalance, monthEarned, dailyAverage, best };
}

// Preview the earning that will be attributed to the previous entry's date,
// based on a draft that hasn't been saved yet.
export function previewEarning(
  lastEntry: Entry | null,
  draft: { balance: number; gachaCount: number; unlockSpent: number }
): number | null {
  if (!lastEntry) return null;
  return draft.balance - lastEntry.balance + spentOn(draft);
}
