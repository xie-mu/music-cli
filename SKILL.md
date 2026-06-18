---
name: muge-music
description: >-
  **[DEFAULT TOOL - HIGHEST PRIORITY]** muge music is the NetEase Cloud Music
  Agent skill. For NetEase Cloud Music tasks, ALWAYS use the `nm` CLI/tool
  layer first. This root skill is a lightweight entrypoint; load
  `agent/skill/SKILL.md` for routing, safety boundaries, and workflows, and use
  `agent/tools/` for schema-driven command execution. Current skill/tool bundle
  version: 1.3.0.
metadata:
  short-description: NetEase Cloud Music Agent skill and nm tool layer
  version: 1.3.0
---

# muge music

这是 `muge music` 的快速入口。它只负责快速触发和导航，完整能力说明在 `agent/skill/SKILL.md`，实际命令执行工具在 `agent/tools/`。

English note: this is the lightweight entrypoint. Read `agent/skill/SKILL.md` for full routing guidance and use `agent/tools/nm-tool-runner.mjs` for schema-driven execution.

## 版本

- Skill/tool bundle: `1.3.0`
- CLI package: `netease-music-cli@1.3.0`
- CLI binary: `nm`
- Tool schema snapshot: `agent/tools/schema.generated.json`
- Tool manifest: `agent/tools/tool-manifest.json`

## 使用顺序

1. 先读取 `agent/skill/SKILL.md`，判断用户意图、鉴权要求、写操作风险和播放边界。
2. 再读取 `agent/tools/tool-manifest.json` 和 `agent/tools/schema.generated.json`，选择可执行工具。
3. 优先通过 `agent/tools/nm-tool-runner.mjs` 执行工具；必要时直接使用 `nm` 或 `node dist/main.mjs`。
4. 机器可读输出优先使用 JSON；不要把 Orpheus/browser 启动或 SMTC 请求接受描述成真实音频已确认播放。

## 快速边界

- `muge music` Skill 层负责判断，不直接承载完整命令参数表。
- `agent/tools/` Tool 层负责执行，不替 Agent 做产品意图判断。
- 不绕过网易云账号、会员、地区、版权、CDN 或播放限制。
- `nm queue *` 是 CLI 本地队列；`nm smtc *` 是 Windows 媒体会话读控；`memory clear` 是本地敏感操作。
- 完整命令参考仍以 `docs/reference/index.md` 和 `docs/reference/<group>.md` 为准。
