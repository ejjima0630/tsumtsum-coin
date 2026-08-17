# ツム貯金

ツムツムの所持コインを記録すると、前回からの差分と使った額(ガチャ・レベル上限解放)から、その日の稼ぎを逆算してくれるアプリ。データは Notion に保存する。

## セットアップ

```bash
npm install
```

`.env.local` を作成し、以下を設定する:

```
NOTION_TOKEN=ntn_...
NOTION_TSUMTSUM_DATA_SOURCE_ID=...
```

- `NOTION_TOKEN`: Notion インテグレーションのシークレット。https://www.notion.so/my-integrations で発行し、記録用のデータベース(下記スキーマ)を持つページに「接続」させる
- `NOTION_TSUMTSUM_DATA_SOURCE_ID`: そのデータベースのデータソース ID

### Notion 側のデータベーススキーマ

| プロパティ | 型 |
|---|---|
| 名前 | タイトル(ISO日付文字列) |
| 日付 | 日付 |
| 所持コイン | 数値 |
| ガチャ回数 | 数値 |
| 上限解放 | 数値 |
| 使用コイン | 数式: `ガチャ回数 * 30000 + 上限解放` |
| 稼ぎ | 数値(アプリが書き込む) |
| 対象日数 | 数値(アプリが書き込む) |

```bash
npm run dev
```

http://localhost:3002 を開く。
