import { NextRequest, NextResponse } from "next/server";
import { listEntries, upsertEntry, EntryInput } from "@/lib/store";

export async function GET() {
  const entries = await listEntries();
  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }
  if (typeof body.balance !== "number" || !Number.isFinite(body.balance)) {
    return NextResponse.json({ error: "balance must be a number" }, { status: 400 });
  }

  const input: EntryInput = {
    date: body.date,
    balance: body.balance,
    gachaCount: typeof body.gachaCount === "number" ? body.gachaCount : 0,
    unlockSpent: typeof body.unlockSpent === "number" ? body.unlockSpent : 0,
  };

  await upsertEntry(input);
  const entries = await listEntries();
  return NextResponse.json({ entries });
}
