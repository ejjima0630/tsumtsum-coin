import { Entry, EntryInput, computeDailyEarnings } from "./earnings";
import * as notion from "./notion";

// Notion-backed store (Phase 2). Same interface as the Phase 1 mock store —
// API routes and UI code are unchanged.
export type { EntryInput };

export async function listEntries(): Promise<Entry[]> {
  return notion.listEntries();
}

// After a create/update at `index` in the (sorted) entries list, the earning
// attributed to the previous entry's date now depends on this row, and — if
// this row isn't the newest — the earning attributed to this row's own date
// now depends on the next row. At most 2 Notion pages get a derived-field write.
async function syncEarningsAround(sorted: Entry[], index: number): Promise<void> {
  const prev = sorted[index - 1];
  const curr = sorted[index];
  const next = sorted[index + 1];

  if (prev) {
    const [earning] = computeDailyEarnings([prev, curr]);
    await notion.writeEarnings(prev.id, earning.earned, earning.spanDays);
  }

  if (next) {
    const [earning] = computeDailyEarnings([curr, next]);
    await notion.writeEarnings(curr.id, earning.earned, earning.spanDays);
  } else {
    await notion.clearEarnings(curr.id);
  }
}

export async function upsertEntry(input: EntryInput): Promise<Entry> {
  const entries = await notion.listEntries();
  const existingIndex = entries.findIndex((e) => e.date === input.date);

  let saved: Entry;
  let sorted: Entry[];
  if (existingIndex >= 0) {
    saved = await notion.updatePage(entries[existingIndex].id, input);
    sorted = [...entries];
    sorted[existingIndex] = saved;
  } else {
    saved = await notion.createPage(input);
    sorted = [...entries, saved].sort((a, b) => a.date.localeCompare(b.date));
  }

  const index = sorted.findIndex((e) => e.id === saved.id);
  await syncEarningsAround(sorted, index);
  return saved;
}

// Only balance/gachaCount/unlockSpent are editable in the UI — the date of
// an existing entry never changes, so this doesn't need to handle re-sorting.
export async function updateEntry(
  id: string,
  patch: Partial<EntryInput>
): Promise<Entry | null> {
  const entries = await notion.listEntries();
  const index = entries.findIndex((e) => e.id === id);
  if (index < 0) return null;

  const merged: EntryInput = { ...entries[index], ...patch };
  const saved = await notion.updatePage(id, merged);

  const sorted = [...entries];
  sorted[index] = saved;
  await syncEarningsAround(sorted, index);
  return saved;
}

export async function deleteEntry(id: string): Promise<boolean> {
  const entries = await notion.listEntries();
  const index = entries.findIndex((e) => e.id === id);
  if (index < 0) return false;

  await notion.archivePage(id);

  const prev = entries[index - 1];
  const next = entries[index + 1];
  if (prev && next) {
    const [earning] = computeDailyEarnings([prev, next]);
    await notion.writeEarnings(prev.id, earning.earned, earning.spanDays);
  } else if (prev && !next) {
    await notion.clearEarnings(prev.id);
  } else if (!prev && next) {
    await notion.clearEarnings(next.id);
  }

  return true;
}
