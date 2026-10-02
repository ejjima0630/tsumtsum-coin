import { ChartPoint, DailyEarning, Entry, expandForChart, toISODate } from "./earnings";

export type CalendarCell = {
  date: string; // YYYY-MM-DD
  inMonth: boolean;
  entry: Entry | null; // the actual reading for this date, if any
  earned: ChartPoint | null; // null when there's no earning data for this date yet
};

// Monday-first week, matching 日本語カレンダーの一般的な表示 (日 is still first
// column since that's the more common convention for 日本語UI; see dow below).
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function weekdayLabels(): string[] {
  return WEEKDAY_LABELS;
}

export function buildMonthGrid(
  year: number,
  month: number, // 1-12
  entries: Entry[],
  dailyEarnings: DailyEarning[]
): CalendarCell[][] {
  const entryByDate = new Map<string, Entry>();
  for (const e of entries) entryByDate.set(e.date, e);

  const earnedByDate = new Map<string, ChartPoint>();
  for (const p of expandForChart(dailyEarnings)) earnedByDate.set(p.date, p);

  const firstOfMonth = new Date(year, month - 1, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month - 1, 1 - startOffset);

  const totalCells = 42; // 6 weeks x 7 days, enough to always cover a month
  const cells: CalendarCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    const dateStr = toISODate(d);
    cells.push({
      date: dateStr,
      inMonth: d.getMonth() === month - 1,
      entry: entryByDate.get(dateStr) ?? null,
      earned: earnedByDate.get(dateStr) ?? null,
    });
  }

  // Drop trailing weeks that fall entirely outside the month.
  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  while (weeks.length > 0 && weeks[weeks.length - 1].every((c) => !c.inMonth)) {
    weeks.pop();
  }

  return weeks;
}
