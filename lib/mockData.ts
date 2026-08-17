import { Entry, GACHA_COST } from "./earnings";

// Deterministic PRNG so the demo data looks the same on every server start.
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// 3 weeks of plausible history: a rest day (no entry, creates a gap the
// chart has to render as an estimated span) and a couple of gacha/unlock days.
export function generateMockEntries(): Entry[] {
  const random = mulberry32(20260816);
  const totalDays = 20;
  const skipOffset = 8;
  const gachaOffsets = new Set([3, 11, 16]);
  const unlockOffsets = new Set([6, 14]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let balance = 42000;
  const entries: Entry[] = [];

  for (let offset = totalDays; offset >= 0; offset--) {
    if (offset === skipOffset) continue;

    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const dateStr = isoDate(date);
    const isFirst = entries.length === 0;

    const gachaCount = !isFirst && gachaOffsets.has(offset) ? 1 : 0;
    const unlockSpent = !isFirst && unlockOffsets.has(offset) ? 4000 : 0;

    if (!isFirst) {
      const spent = gachaCount * GACHA_COST + unlockSpent;
      const earned = 15000 + Math.floor(random() * 25000);
      balance = balance + earned - spent;
    }

    entries.push({ id: `mock-${dateStr}`, date: dateStr, balance, gachaCount, unlockSpent });
  }

  return entries;
}
