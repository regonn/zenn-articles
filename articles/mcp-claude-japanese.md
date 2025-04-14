---
title: "mcp-obsidian 使おうとした時に日本語パスだったときの claude_desktop_config.json の書き方"
emoji: "📖"
type: "tech"
topics: ["mcp", "obsidian", "claude"]
published: true
---

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

無事読み込めました。
