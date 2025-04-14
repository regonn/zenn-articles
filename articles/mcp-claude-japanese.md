---
title: "mcp-obsidian 使おうとした時に日本語パスだったときの claude_desktop_config.json の書き方"
emoji: "📖"
type: "tech"
topics: ["mcp", "obsidian", "claude"]
published: true
---

## 追記

Google Drive の逐次読み込みタイプのファイルですと、Obsidian ファイルの内容を読み込む際に Claude Desktop が毎回エラーで失敗するようでした。別途[mcp-obsidian(※この記事では npm 版で、 新しい方は PyPI 版でライブラリが異なります)](https://github.com/MarkusPfundstein/mcp-obsidian) を使う記事をかきました。Google Drive を使っている人はこちらの方が良さそうです。

https://zenn.dev/regonn/articles/mcp-claude-obsidian

## 本文

https://github.com/smithery-ai/mcp-obsidian

mcp-obsidian を Claude Desktop で使おうとした時に、Obsidian の Vault を Google Drive 上で管理していたのですが、次のようなパスでした。

```
"G:\マイドライブ\obsidian"
```

そうなると、claude_desktop_config.json で書く時に日本語が入ってくるせいで、そのまま書けかなったので、次のように書きました。

```json
{
  "mcpServers": {
    "mcp-obsidian": {
      "command": "npx",
      "args": [
        "-y",
        "@smithery/cli@latest",
        "run",
        "mcp-obsidian",
        "--config",
        "'{\"vaultPath\":\"G:\\\\マイドライブ\\\\obsidian\"}'"
      ]
    }
  }
}
```

無事 claude_desktop_config.json ファイルが Claude Desktop に読み込まれました。
