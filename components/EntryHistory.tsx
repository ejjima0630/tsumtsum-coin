"use client";

import { useState } from "react";
import { DailyEarning, Entry, UNLOCK_STEP, spentOn } from "@/lib/earnings";

type Props = {
  entries: Entry[]; // ascending by date
  dailyEarnings: DailyEarning[]; // ascending, length = entries.length - 1
  onEdit: (
    id: string,
    patch: { balance?: number; gachaCount?: number; unlockSpent?: number }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function yen(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

export default function EntryHistory({ entries, dailyEarnings, onEdit, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <section className="rounded-2xl bg-surface p-5">
        <h2 className="font-display text-sm tracking-[0.2em] text-gold-bright mb-2">履歴</h2>
        <p className="text-sm text-muted">まだ記録がありません。上のフォームから最初の所持コインを記録してください。</p>
      </section>
    );
  }

  const rows = entries
    .map((entry, index) => ({
      entry,
      earned: index === 0 ? null : dailyEarnings[index - 1] ?? null,
      prevDate: index === 0 ? null : entries[index - 1].date,
    }))
    .reverse();

  return (
    <section className="rounded-2xl bg-surface p-5 space-y-3">
      <h2 className="font-display text-sm tracking-[0.2em] text-gold-bright">履歴</h2>
      <ul className="space-y-2">
        {rows.map(({ entry, earned, prevDate }) => (
          <HistoryRow
            key={entry.id}
            entry={entry}
            earned={earned}
            prevDate={prevDate}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </section>
  );
}

function HistoryRow({
  entry,
  earned,
  prevDate,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  earned: DailyEarning | null;
  prevDate: string | null;
  onEdit: Props["onEdit"];
  onDelete: Props["onDelete"];
}) {
  const [editing, setEditing] = useState(false);
  const [balanceText, setBalanceText] = useState(String(entry.balance));
  const [gachaCount, setGachaCount] = useState(entry.gachaCount);
  const [unlockSpent, setUnlockSpent] = useState(entry.unlockSpent);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setBalanceText(String(entry.balance));
    setGachaCount(entry.gachaCount);
    setUnlockSpent(entry.unlockSpent);
    setEditing(true);
  }

  async function save() {
    const balance = Number(balanceText);
    if (!Number.isFinite(balance) || balance < 0) return;
    setSaving(true);
    try {
      await onEdit(entry.id, { balance, gachaCount, unlockSpent });
      setEditing(false);
    } catch {
      alert("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const message = prevDate
      ? `${entry.date} の記録を削除します。${prevDate} の稼ぎが再計算されます。よろしいですか?`
      : `${entry.date} の記録を削除します。よろしいですか?`;
    if (!window.confirm(message)) return;
    try {
      await onDelete(entry.id);
    } catch {
      alert("削除に失敗しました");
    }
  }

  const spent = spentOn(entry);

  if (editing) {
    return (
      <li className="rounded-xl bg-surface-raised p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-mono">{entry.date}</span>
          <button type="button" onClick={() => setEditing(false)} className="text-muted underline">
            キャンセル
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <label className="flex flex-col gap-1 text-muted">
            所持コイン
            <input
              type="number"
              inputMode="numeric"
              value={balanceText}
              onChange={(e) => setBalanceText(e.target.value)}
              className="rounded-md bg-bg px-2 py-1.5 text-ink font-mono tabular-nums"
            />
          </label>
          <label className="flex flex-col gap-1 text-muted">
            ガチャ
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={gachaCount}
              onChange={(e) => setGachaCount(Math.max(0, Number(e.target.value) || 0))}
              className="rounded-md bg-bg px-2 py-1.5 text-ink font-mono tabular-nums"
            />
          </label>
          <label className="flex flex-col gap-1 text-muted">
            上限解放
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={UNLOCK_STEP}
              value={unlockSpent}
              onChange={(e) => setUnlockSpent(Math.max(0, Number(e.target.value) || 0))}
              className="rounded-md bg-bg px-2 py-1.5 text-ink font-mono tabular-nums"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full rounded-lg bg-gold py-2 text-sm font-bold text-bg disabled:opacity-40"
        >
          {saving ? "保存中…" : "保存する"}
        </button>
      </li>
    );
  }

  return (
    <li className="rounded-xl bg-surface-raised px-3 py-2.5">
      <div className="flex items-baseline gap-2">
        <span className="whitespace-nowrap font-mono text-xs text-muted">{entry.date}</span>
        {earned === null && (
          <span className="whitespace-nowrap rounded bg-bg px-1.5 py-0.5 text-[10px] text-muted">基準</span>
        )}
        {earned && earned.spanDays > 1 && (
          <span className="whitespace-nowrap rounded bg-bg px-1.5 py-0.5 text-[10px] text-gold-bright">
            {earned.spanDays}日分
          </span>
        )}
        {earned && (
          <span
            className={`ml-auto shrink-0 whitespace-nowrap text-right font-mono tabular-nums text-sm ${earned.isNegative ? "text-rust" : "text-jade"}`}
          >
            {earned.earned >= 0 ? "+" : ""}
            {yen(earned.earned)}
          </span>
        )}
      </div>

      <div className="mt-1 overflow-x-auto">
        <div className="whitespace-nowrap font-mono tabular-nums text-ink">
          {yen(entry.balance)} <span className="text-xs text-muted">コイン</span>
        </div>
        {spent > 0 && (
          <div className="whitespace-nowrap text-xs text-muted">
            使用 {yen(spent)}
            {entry.gachaCount > 0 ? `(ガチャ${entry.gachaCount}回)` : ""}
          </div>
        )}
      </div>

      <div className="mt-1.5 flex justify-end gap-1">
        <button
          type="button"
          onClick={startEdit}
          aria-label="編集"
          className="rounded-md px-2 py-1 text-xs text-muted hover:text-gold-bright"
        >
          編集
        </button>
        <button
          type="button"
          onClick={remove}
          aria-label="削除"
          className="rounded-md px-2 py-1 text-xs text-muted hover:text-rust"
        >
          削除
        </button>
      </div>
    </li>
  );
}
