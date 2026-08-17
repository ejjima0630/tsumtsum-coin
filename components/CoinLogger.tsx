"use client";

import { useCallback, useEffect, useState } from "react";
import { Entry, computeDailyEarnings, computeSummary } from "@/lib/earnings";
import BalanceInput from "./BalanceInput";
import CoinChart from "./CoinChart";
import EntryHistory from "./EntryHistory";

type Status = "loading" | "ready" | "error";

type EntryDraft = { date: string; balance: number; gachaCount: number; unlockSpent: number };
type EntryPatch = Partial<EntryDraft>;

function yen(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

export default function CoinLogger() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  // Does not set "loading" itself — the initial state already is "loading",
  // and the retry button sets it explicitly before calling this again.
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/entries");
      if (!res.ok) throw new Error("failed to load");
      const data = await res.json();
      setEntries(data.entries as Entry[]);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount. setState only happens after the awaited
    // fetch resolves, not synchronously — this rule can't tell the two apart.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function retry() {
    setStatus("loading");
    load();
  }

  async function submit(input: EntryDraft) {
    const optimistic: Entry = { id: `pending-${input.date}`, ...input };
    setEntries((prev) => {
      const withoutSameDate = prev.filter((e) => e.date !== input.date);
      return [...withoutSameDate, optimistic].sort((a, b) => a.date.localeCompare(b.date));
    });

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("failed to save");
      const data = await res.json();
      setEntries(data.entries as Entry[]);
    } catch (err) {
      await load();
      throw err;
    }
  }

  async function edit(id: string, patch: EntryPatch) {
    const previous = entries;
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

    try {
      const res = await fetch(`/api/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("failed to update");
      const data = await res.json();
      setEntries(data.entries as Entry[]);
    } catch (err) {
      setEntries(previous);
      throw err;
    }
  }

  async function remove(id: string) {
    const previous = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id));

    try {
      const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed to delete");
      const data = await res.json();
      setEntries(data.entries as Entry[]);
    } catch (err) {
      setEntries(previous);
      throw err;
    }
  }

  if (status === "loading") {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-28 rounded-2xl bg-surface" />
          <div className="h-48 rounded-2xl bg-surface" />
          <div className="h-40 rounded-2xl bg-surface" />
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
        <p className="text-sm text-muted">Notion に繋がりません</p>
        <button type="button" onClick={retry} className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-bg">
          再試行
        </button>
      </main>
    );
  }

  const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;
  const dailyEarnings = computeDailyEarnings(entries);
  const summary = computeSummary(entries);

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 py-8">
      <header className="coin-settle space-y-4 rounded-2xl bg-surface p-5">
        <div>
          <p className="font-display text-xs tracking-[0.3em] text-muted">ツム貯金</p>
          <p className="mt-1 text-sm text-muted">所持コイン</p>
          <p className="font-mono text-4xl font-bold tabular-nums text-gold-bright">
            {summary.currentBalance !== null ? yen(summary.currentBalance) : "―"}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-bg pt-3 text-center">
          <StatTile label="今月の稼ぎ" value={yen(summary.monthEarned)} />
          <StatTile label="1日平均" value={yen(summary.dailyAverage)} />
          <StatTile label="最高記録" value={summary.best ? yen(summary.best.earned) : "―"} />
        </div>
      </header>

      <BalanceInput lastEntry={lastEntry} existingEntries={entries} onSubmit={submit} />
      <CoinChart dailyEarnings={dailyEarnings} />
      <EntryHistory entries={entries} dailyEarnings={dailyEarnings} onEdit={edit} onDelete={remove} />
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className="font-mono text-sm tabular-nums text-ink">{value}</p>
    </div>
  );
}
