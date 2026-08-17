"use client";

import { FormEvent, useState } from "react";
import { Entry, GACHA_COST, UNLOCK_STEP, previewEarning, toISODate } from "@/lib/earnings";

type Props = {
  lastEntry: Entry | null;
  existingEntries: Entry[];
  onSubmit: (input: {
    date: string;
    balance: number;
    gachaCount: number;
    unlockSpent: number;
  }) => Promise<void>;
};

function todayStr(): string {
  return toISODate(new Date());
}

function yen(n: number): string {
  return n.toLocaleString("ja-JP");
}

export default function BalanceInput({ lastEntry, existingEntries, onSubmit }: Props) {
  const [date, setDate] = useState(todayStr());
  const [balanceText, setBalanceText] = useState("");
  const [gachaCount, setGachaCount] = useState(0);
  const [unlockSpent, setUnlockSpent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = Number(balanceText);
  const isValid = balanceText.trim() !== "" && Number.isFinite(balance) && balance >= 0;
  const preview = isValid ? previewEarning(lastEntry, { balance, gachaCount, unlockSpent }) : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;

    const existing = existingEntries.find((entry) => entry.date === date);
    if (existing) {
      const ok = window.confirm(
        `${date} の記録(${yen(existing.balance)} コイン)を上書きします。よろしいですか?`
      );
      if (!ok) return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ date, balance, gachaCount, unlockSpent });
      setBalanceText("");
      setGachaCount(0);
      setUnlockSpent(0);
    } catch {
      setError("記録に失敗しました。もう一度お試しください");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-surface p-5 space-y-4">
      <h2 className="font-display text-sm tracking-[0.2em] text-gold-bright">記録する</h2>

      {lastEntry && (
        <p className="text-sm text-muted">
          前回 <span className="font-mono">{lastEntry.date}</span> →{" "}
          <span className="font-mono tabular-nums text-ink">{yen(lastEntry.balance)}</span> コイン
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          日付
          <input
            type="date"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg bg-surface-raised px-3 py-2 text-ink font-mono tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-gold-bright"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          所持コイン
          <input
            type="number"
            inputMode="numeric"
            placeholder="128400"
            value={balanceText}
            onChange={(e) => setBalanceText(e.target.value)}
            className="rounded-lg bg-surface-raised px-3 py-2 text-lg text-ink font-mono tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-gold-bright"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stepper
          label="ガチャ"
          value={gachaCount}
          step={1}
          min={0}
          onChange={setGachaCount}
          displayValue={`${gachaCount} 回`}
          hint={`= ${yen(gachaCount * GACHA_COST)} コイン`}
        />
        <Stepper
          label="上限解放"
          value={unlockSpent}
          step={UNLOCK_STEP}
          min={0}
          onChange={setUnlockSpent}
          displayValue={yen(unlockSpent)}
          hint="コイン"
        />
      </div>

      {preview !== null && lastEntry && (
        <p className={`text-sm ${preview < 0 ? "text-rust" : "text-jade"}`}>
          {preview < 0
            ? `計算上マイナスです(${yen(preview)})。使った額の入力漏れかもしれません`
            : `→ ${lastEntry.date} の稼ぎ ${yen(preview)} コイン`}
        </p>
      )}

      {error && <p className="text-sm text-rust">{error}</p>}

      <button
        type="submit"
        disabled={!isValid || submitting}
        className="w-full rounded-xl bg-gold py-3.5 text-base font-bold text-bg transition-opacity disabled:opacity-40 active:opacity-80"
      >
        {submitting ? "記録中…" : "記録する"}
      </button>
    </form>
  );
}

function Stepper({
  label,
  value,
  step,
  min,
  onChange,
  displayValue,
  hint,
}: {
  label: string;
  value: number;
  step: number;
  min: number;
  onChange: (v: number) => void;
  displayValue: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-1 text-xs text-muted">
      <span>{label}</span>
      <div className="flex items-center gap-1 rounded-lg bg-surface-raised p-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="h-9 w-9 shrink-0 rounded-md bg-bg text-lg leading-none text-gold-bright active:opacity-70"
          aria-label={`${label}を減らす`}
        >
          −
        </button>
        <span className="flex-1 text-center font-mono tabular-nums text-ink">{displayValue}</span>
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="h-9 w-9 shrink-0 rounded-md bg-bg text-lg leading-none text-gold-bright active:opacity-70"
          aria-label={`${label}を増やす`}
        >
          +
        </button>
      </div>
      <span className="font-mono text-[11px] text-muted">{hint}</span>
    </div>
  );
}
