---
title: "Google Driveで運用している Obsidian を Claude Desktop MCP で操作する"
emoji: "💎"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["mcp", "obsidian", "claude"]
published: true
---

前回、[mcp-obsidian](https://github.com/smithery-ai/mcp-obsidian)を利用した次のような記事を書きました。

https://zenn.dev/regonn/articles/mcp-claude-japanese

後々気付いたのですが、Google Drive で逐次ファイル読み込みを行う場合、Claude でファイル読み込み時に毎回エラーが発生し、正しく読み込めませんでした。

## 他の方法

https://zenn.dev/acntechjp/articles/789c711b63303b

上記の記事では、Obsidian のプラグインである `Local REST API` と `MCP Tools` を利用して、Obsidian 側で MCP サーバーを立てる方法を紹介しています。しかし、この方法もインストール時に問題が発生しました。日本語が含まれる `"G:\マイドライブ\obsidian"` のような Vault ファイルパスでは、サーバーのインストール時にエラーが発生し、正常に動作しませんでした。

## 他の方法 2 (これで解決)

https://github.com/MarkusPfundstein/mcp-obsidian

次に、mcp-obsidian の PyPI 版を試してみました。前回の記事で使用したのは npm 版で、今回は別のライブラリです。この方法では、`Local REST API` を利用して Obsidian で REST API サーバーを立て、Claude Desktop 側で MCP サーバーを起動します。

この方法の利点は、設定に必要な情報が最小限であることです。API キーと REST API URL（ローカル Obsidian サーバー）のみで設定可能で、claude_desktop_config.json に日本語を含める必要がありません。

```json
{
  "mcp-obsidian": {
    "command": "uvx",
    "args": ["mcp-obsidian"],
    "env": {
      "OBSIDIAN_API_KEY": "<your_api_key_here>",
      "OBSIDIAN_HOST": "<your_obsidian_host>"
    }
  }
}
```

この設定で起動したところ、検索やファイル読み込みが正常に動作するようになりました。
