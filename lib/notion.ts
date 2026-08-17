import { Entry, EntryInput } from "./earnings";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2025-09-03"; // this DB uses the data-source model

function token(): string {
  const value = process.env.NOTION_TOKEN;
  if (!value) throw new Error("NOTION_TOKEN is not set");
  return value;
}

function dataSourceId(): string {
  const value = process.env.NOTION_TSUMTSUM_DATA_SOURCE_ID;
  if (!value) throw new Error("NOTION_TSUMTSUM_DATA_SOURCE_ID is not set");
  return value;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${token()}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function notionFetch(path: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(`${NOTION_API}${path}`, { ...init, headers: headers() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion API ${res.status}: ${body}`);
  }
  return res.json();
}

type NotionNumber = { number: number | null };
type NotionDate = { date: { start: string } | null };
type NotionTitle = { title: { plain_text: string }[] };

type NotionPage = {
  id: string;
  properties: {
    名前: NotionTitle;
    日付: NotionDate;
    所持コイン: NotionNumber;
    ガチャ回数: NotionNumber;
    上限解放: NotionNumber;
  };
};

type QueryResponse = {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
};

function toEntry(page: NotionPage): Entry {
  const p = page.properties;
  return {
    id: page.id,
    date: p.日付.date?.start ?? p.名前.title[0]?.plain_text ?? "",
    balance: p.所持コイン.number ?? 0,
    gachaCount: p.ガチャ回数.number ?? 0,
    unlockSpent: p.上限解放.number ?? 0,
  };
}

function toProperties(input: EntryInput): Record<string, unknown> {
  return {
    名前: { title: [{ text: { content: input.date } }] },
    日付: { date: { start: input.date } },
    所持コイン: { number: input.balance },
    ガチャ回数: { number: input.gachaCount },
    上限解放: { number: input.unlockSpent },
  };
}

export async function listEntries(): Promise<Entry[]> {
  const entries: Entry[] = [];
  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const data = (await notionFetch(`/data_sources/${dataSourceId()}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    })) as QueryResponse;

    entries.push(...data.results.map(toEntry));
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

export async function createPage(input: EntryInput): Promise<Entry> {
  const page = (await notionFetch("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "data_source_id", data_source_id: dataSourceId() },
      properties: toProperties(input),
    }),
  })) as NotionPage;
  return toEntry(page);
}

export async function updatePage(pageId: string, input: EntryInput): Promise<Entry> {
  const page = (await notionFetch(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: toProperties(input) }),
  })) as NotionPage;
  return toEntry(page);
}

export async function archivePage(pageId: string): Promise<void> {
  await notionFetch(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ archived: true }),
  });
}

// Writes the derived 稼ぎ/対象日数 columns so the database reads sensibly on
// its own in Notion. The app itself never reads these back — it always
// recomputes earnings from the raw balance/spend fields (see lib/earnings.ts).
export async function writeEarnings(pageId: string, earned: number, spanDays: number): Promise<void> {
  await notionFetch(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({
      properties: {
        稼ぎ: { number: Math.round(earned) },
        対象日数: { number: spanDays },
      },
    }),
  });
}

export async function clearEarnings(pageId: string): Promise<void> {
  await notionFetch(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({
      properties: {
        稼ぎ: { number: null },
        対象日数: { number: null },
      },
    }),
  });
}
