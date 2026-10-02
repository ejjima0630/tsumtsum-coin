"use client";

import { useMemo, useState } from "react";
import { DailyEarning, Entry, spentOn, toISODate } from "@/lib/earnings";
import { buildMonthGrid, weekdayLabels } from "@/lib/calendar";

type Metric = "earned" | "balance";

function yen(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

// Calendar cells are small — "1,234,567" doesn't fit. "123万" does.
function compact(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs < 10000) return `${sign}${abs.toLocaleString("ja-JP")}`;
  const man = abs / 10000;
  const digits = man >= 100 ? Math.round(man).toString() : man.toFixed(1).replace(/\.0$/, "");
  return `${sign}${digits}万`;
}

export default function CalendarView({
  entries,
  dailyEarnings,
}: {
  entries: Entry[];
  dailyEarnings: DailyEarning[];
}) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [metric, setMetric] = useState<Metric>("earned");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const weeks = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month, entries, dailyEarnings),
    [cursor, entries, dailyEarnings]
  );

  const todayStr = toISODate(today);

  function changeMonth(delta: number) {
    setSelectedDate(null);
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }

  const selectedCell = selectedDate
    ? weeks.flat().find((c) => c.date === selectedDate) ?? null
    : null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="前の月"
            className="h-8 w-8 rounded-md bg-surface-raised text-gold-bright"
          >
            ←
          </button>
          <h2 className="font-display text-sm tracking-[0.1em] text-gold-bright">
            {cursor.year}年{cursor.month}月
          </h2>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="次の月"
            className="h-8 w-8 rounded-md bg-surface-raised text-gold-bright"
          >
            →
          </button>
        </div>

        <div className="flex justify-center gap-1 rounded-lg bg-surface-raised p-1">
          {(["earned", "balance"] as Metric[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setMetric(key)}
              className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${
                metric === key ? "bg-gold text-bg" : "text-muted"
              }`}
            >
              {key === "earned" ? "稼ぎ" : "コイン数"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
          {weekdayLabels().map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((cell) => {
            const day = Number(cell.date.slice(-2));
            const value = metric === "earned" ? cell.earned?.earned ?? null : cell.entry?.balance ?? null;
            const estimated = metric === "earned" && (cell.earned?.estimated ?? false);
            const hasValue = value !== null;
            const isToday = cell.date === todayStr;
            const isSelected = cell.date === selectedDate;

            return (
              <button
                key={cell.date}
                type="button"
                disabled={!hasValue}
                onClick={() => setSelectedDate(isSelected ? null : cell.date)}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] transition-colors ${
                  cell.inMonth || isSelected ? "" : "opacity-30"
                } ${isSelected ? "bg-gold text-bg" : hasValue ? "bg-surface-raised" : ""} ${
                  isToday && !isSelected ? "ring-1 ring-gold-bright" : ""
                }`}
                style={
                  estimated && !isSelected
                    ? {
                        backgroundImage:
                          "repeating-linear-gradient(45deg, var(--gold), var(--gold) 2px, transparent 2px, transparent 6px)",
                        backgroundColor: "var(--surface-raised)",
                      }
                    : undefined
                }
              >
                <span className={isSelected ? "text-bg" : "text-muted"}>{day}</span>
                {hasValue && (
                  <span
                    className={`font-mono tabular-nums ${
                      isSelected
                        ? "text-bg"
                        : metric === "earned"
                        ? (value as number) < 0
                          ? "text-rust"
                          : "text-jade"
                        : "text-ink"
                    }`}
                  >
                    {metric === "earned" && (value as number) >= 0 ? "+" : ""}
                    {compact(value as number)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {selectedCell && (
        <section className="rounded-2xl bg-surface p-5">
          <p className="font-mono text-xs text-muted">{selectedCell.date}</p>
          {selectedCell.entry && (
            <>
              <p className="mt-1 font-mono tabular-nums text-lg text-ink">
                {yen(selectedCell.entry.balance)} <span className="text-xs text-muted">コイン</span>
              </p>
              {spentOn(selectedCell.entry) > 0 && (
                <p className="text-xs text-muted">
                  使用 {yen(spentOn(selectedCell.entry))}
                  {selectedCell.entry.gachaCount > 0 ? `(ガチャ${selectedCell.entry.gachaCount}回)` : ""}
                </p>
              )}
            </>
          )}
          {selectedCell.earned && (
            <p className={`mt-1 text-sm ${selectedCell.earned.earned < 0 ? "text-rust" : "text-jade"}`}>
              稼ぎ {selectedCell.earned.earned >= 0 ? "+" : ""}
              {yen(selectedCell.earned.earned)} コイン
              {selectedCell.earned.estimated && <span className="ml-1 text-muted">(推定)</span>}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
