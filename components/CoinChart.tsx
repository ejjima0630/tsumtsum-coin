"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChartPoint, DailyEarning, expandForChart, toISODate } from "@/lib/earnings";

type PeriodKey = "2w" | "1m" | "3m";

const PERIODS: Record<PeriodKey, { label: string; days: number; slot: number }> = {
  "2w": { label: "2週間", days: 14, slot: 24 },
  "1m": { label: "1ヶ月", days: 30, slot: 16 },
  "3m": { label: "3ヶ月", days: 90, slot: 9 },
};

const CHART_HEIGHT = 180;
const BASE_Y = CHART_HEIGHT - 24; // baseline; bottom margin reserved for breathing room
const TOP_MARGIN = 14; // headroom above the tallest bar for the coin cap

function yen(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

export default function CoinChart({ dailyEarnings }: { dailyEarnings: DailyEarning[] }) {
  const [period, setPeriod] = useState<PeriodKey>("2w");
  const [selected, setSelected] = useState<ChartPoint | null>(null);

  const pointsByDate = useMemo(() => {
    const map = new Map<string, ChartPoint>();
    for (const p of expandForChart(dailyEarnings)) map.set(p.date, p);
    return map;
  }, [dailyEarnings]);

  const { days, slot } = PERIODS[period];

  const windowDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(toISODate(d));
    }
    return dates;
  }, [days]);

  const visiblePoints = windowDates.map((date) => pointsByDate.get(date) ?? null);
  const values = visiblePoints.filter((p): p is ChartPoint => p !== null).map((p) => p.earned);
  const maxValue = Math.max(1, ...values);
  const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const innerHeight = BASE_Y - TOP_MARGIN;

  function barHeight(v: number): number {
    return Math.max(3, (innerHeight * Math.max(0, v)) / maxValue);
  }

  function selectPeriod(key: PeriodKey) {
    setPeriod(key);
    setSelected(null);
  }

  const svgWidth = days * slot;

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Data is anchored to today (the right edge) — start scrolled there
    // instead of at the empty left edge when a period is wider than the screen.
    scrollRef.current?.scrollTo({ left: svgWidth });
  }, [period, svgWidth]);

  return (
    <section className="rounded-2xl bg-surface p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm tracking-[0.2em] text-gold-bright">日々の推移</h2>
        <div className="flex gap-1 rounded-lg bg-surface-raised p-1">
          {(Object.keys(PERIODS) as PeriodKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => selectPeriod(key)}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                period === key ? "bg-gold text-bg" : "text-muted"
              }`}
            >
              {PERIODS[key].label}
            </button>
          ))}
        </div>
      </div>

      {values.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">この期間の記録はまだありません</p>
      ) : (
        <>
          <div ref={scrollRef} className="overflow-x-auto">
            <svg
              width={svgWidth}
              height={CHART_HEIGHT}
              viewBox={`0 0 ${svgWidth} ${CHART_HEIGHT}`}
              className="block"
              role="img"
              aria-label="日別のコイン獲得数の推移グラフ"
            >
              <defs>
                <linearGradient id="coinFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold-bright)" />
                  <stop offset="100%" stopColor="var(--gold)" />
                </linearGradient>
                <pattern id="coinRidges" patternUnits="userSpaceOnUse" width="8" height="6">
                  <line x1="0" y1="6" x2="8" y2="6" stroke="var(--bg)" strokeOpacity="0.35" strokeWidth="1" />
                </pattern>
                <pattern id="estimatedHatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="var(--gold)" strokeOpacity="0.5" strokeWidth="1.5" />
                </pattern>
              </defs>

              <line
                x1={0}
                x2={svgWidth}
                y1={BASE_Y - barHeight(average)}
                y2={BASE_Y - barHeight(average)}
                stroke="var(--muted)"
                strokeDasharray="3 4"
                strokeWidth={1}
              />

              {visiblePoints.map((point, i) => {
                if (!point) return null;
                const x = i * slot;
                const barWidth = Math.max(4, slot - 5);
                const h = barHeight(point.earned);
                const y = BASE_Y - h;
                const isSelected = selected?.date === point.date;

                return (
                  <g
                    key={point.date}
                    onClick={() => setSelected(isSelected ? null : point)}
                    className="cursor-pointer"
                  >
                    <rect x={x} y={0} width={slot} height={BASE_Y} fill="transparent" />
                    <rect
                      x={x + (slot - barWidth) / 2}
                      y={y}
                      width={barWidth}
                      height={h}
                      rx={Math.min(3, barWidth / 3)}
                      fill={point.estimated ? "url(#estimatedHatch)" : "url(#coinFill)"}
                      stroke={point.estimated ? "var(--gold)" : "none"}
                      strokeOpacity={point.estimated ? 0.6 : 1}
                      strokeDasharray={point.estimated ? "2 2" : undefined}
                    />
                    {!point.estimated && (
                      <>
                        <rect
                          x={x + (slot - barWidth) / 2}
                          y={y}
                          width={barWidth}
                          height={h}
                          rx={Math.min(3, barWidth / 3)}
                          fill="url(#coinRidges)"
                        />
                        <ellipse cx={x + slot / 2} cy={y} rx={barWidth / 2} ry={2.5} fill="var(--gold-bright)" />
                      </>
                    )}
                    {isSelected && <circle cx={x + slot / 2} cy={y - 8} r={2.5} fill="var(--gold-bright)" />}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted">
            <span className="whitespace-nowrap">
              平均 <span className="font-mono tabular-nums text-ink">{yen(average)}</span> コイン
            </span>
            {selected && (
              <span className="whitespace-nowrap text-ink">
                {selected.date}
                {selected.estimated ? "(推定)" : ""}:{" "}
                <span className="font-mono tabular-nums text-gold-bright">{yen(selected.earned)}</span> コイン
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
}
