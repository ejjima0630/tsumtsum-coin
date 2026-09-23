"use client";

import { useRef, useState } from "react";
import { DailyEarning, Entry, UNLOCK_STEP, spentOn } from "@/lib/earnings";

const REVEAL_WIDTH = 76; // px width of the swipe-revealed delete button
const DRAG_THRESHOLD = 4; // px of pointer movement before a press counts as a drag, not a tap

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
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-sm tracking-[0.2em] text-gold-bright">履歴</h2>
        <p className="text-[11px] text-muted">タップで編集・左スワイプで削除</p>
      </div>
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

  // Swipe-left-to-reveal delete. offset is the row's horizontal translate:
  // 0 = closed, -REVEAL_WIDTH = fully open. Pointer Events so the same code
  // handles touch and mouse (and so this is testable with a plain mouse drag).
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null);
  // Set on pointerup if the press moved past the threshold, cleared by the
  // click handler — click fires *after* pointerup, so this can't just live
  // on dragRef (that's already cleared by then).
  const justDraggedRef = useRef(false);

  function startEdit() {
    setBalanceText(String(entry.balance));
    setGachaCount(entry.gachaCount);
    setUnlockSpent(entry.unlockSpent);
    setOffset(0);
    setEditing(true);
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startOffset: offset };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset(Math.min(0, Math.max(-REVEAL_WIDTH, drag.startOffset + (e.clientX - drag.startX))));
  }

  function endDrag(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    if (Math.abs(e.clientX - drag.startX) > DRAG_THRESHOLD) justDraggedRef.current = true;
    setDragging(false);
    setOffset((current) => (current < -REVEAL_WIDTH / 2 ? -REVEAL_WIDTH : 0));
    dragRef.current = null;
  }

  function handleRowClick() {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    if (offset !== 0) {
      setOffset(0);
      return;
    }
    startEdit();
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
    <li className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-y-0 right-0 flex items-stretch" style={{ width: REVEAL_WIDTH }}>
        <button
          type="button"
          onClick={remove}
          aria-label="削除"
          className="flex-1 bg-rust text-sm font-bold text-ink"
        >
          削除
        </button>
      </div>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={handleRowClick}
        style={{ transform: `translateX(${offset}px)`, touchAction: "pan-y" }}
        className={`relative cursor-pointer select-none bg-surface-raised px-3 py-2.5 ${dragging ? "" : "transition-transform duration-150 ease-out"}`}
      >
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
      </div>
    </li>
  );
}
