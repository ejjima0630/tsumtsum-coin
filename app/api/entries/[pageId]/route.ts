import { NextRequest, NextResponse } from "next/server";
import { listEntries, updateEntry, deleteEntry } from "@/lib/store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const body = await request.json();

  const patch: { date?: string; balance?: number; gachaCount?: number; unlockSpent?: number } = {};
  if (typeof body.date === "string") patch.date = body.date;
  if (typeof body.balance === "number") patch.balance = body.balance;
  if (typeof body.gachaCount === "number") patch.gachaCount = body.gachaCount;
  if (typeof body.unlockSpent === "number") patch.unlockSpent = body.unlockSpent;

  const updated = await updateEntry(pageId, patch);
  if (!updated) {
    return NextResponse.json({ error: "entry not found" }, { status: 404 });
  }

  const entries = await listEntries();
  return NextResponse.json({ entries });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const removed = await deleteEntry(pageId);
  if (!removed) {
    return NextResponse.json({ error: "entry not found" }, { status: 404 });
  }

  const entries = await listEntries();
  return NextResponse.json({ entries });
}
