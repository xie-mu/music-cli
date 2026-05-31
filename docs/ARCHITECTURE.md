# NetEase Cloud Music Agent CLI — Architecture Overview

> Architecture reference document for AI agents and developers
> Built following the Bailian `bl` CLI architectural patterns

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLI 用户交互层                                │
│    nm <resource> <command> [--flag <value>...]                       │
│    bin: nm → dist/netease-music.mjs                                  │
│    Trie 树命令路由 + 自动前缀补全                                    │
├──────────────────────────────────────────────────────────────────────┤
│                         配置合并层                                    │
│    config.json (持久化) ← env 变量 ← CLI flags (优先级递增)           │
│    合并输出: { output, timeout, quiet, verbose, dryRun, ... }        │
├──────────────────────────────────────────────────────────────────────┤
│                        Agent 架构核心层                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │
│  │ 数据层    │  │ 规划引擎  │  │ 本地记忆  │  │ 工具协议          │     │
│  │ song/     │  │ Pipeline │  │ 播放历史  │  │ export-schema    │     │
│  │ playlist/ │  │ workflow │  │ 收藏缓存  │  │ Function Calling │     │
│  │ user/     │  │ DAG/条件  │  └──────────┘  │ Skill 元描述     │     │
│  │ album/    │  │ 表达式    │                └──────────────────┘     │
│  └──────────┘  └──────────┘                                          │
├──────────────────────────────────────────────────────────────────────┤
│                       加密与网络层                                    │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  eapi 加密 (AES-128-ECB + MD5)  ← 当前使用的加密方式        │     │
│  │  weapi (双 AES-CBC + RSA)  ← 备选                          │     │
│  │  Cookie 持久化 (MUSIC_U / __csrf 管理)                     │     │
│  │  HTTP 请求器 (fetch + 浏览器 UA)                           │     │
│  └─────────────────────────────────────────────────────────────┘     │
├──────────────────────────────────────────────────────────────────────┤
│                    网易云音乐 API 层                                  │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  music.163.com (Web API)  /  interface.music.163.com        │     │
│  │  /api/v3/playlist/detail  /  /api/song/enhance/player/url   │     │
│  │  /api/v1/user/detail      /  /api/album/{id}               │     │
│  └─────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

## Encryption Methods

Three encryption methods reverse-engineered from NetEase Web:

| Method | Algorithm | Status | URL Prefix | Body Param |
|---|---|---|---|---|
| **eapi** (current) | AES-128-ECB + MD5 digest | ✅ Active | `/eapi/...` | `params=HEX` |
| **weapi** (legacy) | Double AES-128-CBC + RSA | ⚠️ Fallback | `/weapi/...` | `params=base64&encSecKey=hex` |
| **linuxapi** (deprecated) | AES-128-ECB | ❌ Broken | `/api/linux/forward` | `eparams=HEX` |

### eapi encryption format

```
key = "e82ckenh8dichen8"
digest = MD5("nobody${url}use${text}md5forencrypt")
data = "${url}-36cd479b6b5-${text}-36cd479b6b5-${digest}"
params = AES-ECB-encrypt(data) → uppercase hex
```

Response is also encrypted: hex → AES-ECB decrypt → JSON parse.

## Command Structure

`nm <resource> <command> [flags]`

### Resource groups

| Group | Commands | Auth Required |
|---|---|---|
| `auth` | login, status, logout | — |
| `config` | show, set, export-schema | — |
| `user` | profile, account, history, level, subcount | Yes |
| `music` | info, url, lyric, download, play, like, unlike | Partial |
| `playlist` | show, tracks, list, summary, create | Partial |
| `album` | show, list, sub, unsub, dynamic, summary | Partial |
| `search` | (root), hot, suggest | — |
| `toplist` | (root), detail | — |
| `recommend` | songs, playlists | Yes |
| `pipeline` | validate, run | — |

**Total: 50+ sub-commands across 15 resource groups**

## Playback Strategy

See [PLAYBACK_STRATEGY.md](PLAYBACK_STRATEGY.md) for complete investigation.

**Current approach:** Open browser web player → user clicks play → desktop client handles streaming.

## Pipeline Engine

The CLI includes a DAG-based workflow engine for multi-step orchestration:

- **Steps**: `music/info`, `music/lyric`, `playlist/tracks`, `playlist/summary`, `user/history`, `user/profile`, `album/show`, `search`, `recommend/songs`, `script/js`, `logic/switch`, `logic/select`
- **Expressions**: `${input.xxx}`, `${from.step_id}`, `${env.xxx}`, `$concat`, `$js`
- **Execution**: Kahn topological sort, retry, timeout, condition branching
- **Scenarios**: Playlist analysis report, user weekly summary

## File Structure

```
netease-music-cli/
├── SKILL.md                       # Agent skill metadata
├── src/
│   ├── main.ts                    # Entry point + help system
│   ├── router.ts                  # Trie tree command routing
│   ├── config.ts                  # 3-layer config merging
│   ├── parser.ts                  # CLI argument parser
│   ├── crypto.ts                  # eapi encryption engine
│   ├── http.ts                    # HTTP client + cookie management
│   ├── error.ts                   # Error handling system
│   ├── formatter.ts               # Output formatting
│   ├── player.ts                  # Playback (web player strategy)
│   ├── commands/                  # Command implementations
│   │   ├── auth.ts, config.ts, user.ts, music.ts
│   │   ├── playlist.ts, album.ts, search.ts, toplist.ts
│   │   └── pipeline.ts
│   ├── pipeline/                  # DAG workflow engine
│   │   ├── schema.ts, graph.ts, expression.ts, executor.ts
│   │   └── scenarios/             # Built-in pipeline YAMLs
│   └── types/
│       └── core.ts                # TypeScript interfaces
├── docs/
│   ├── ARCHITECTURE.md            # This file
│   ├── PLAYBACK_STRATEGY.md       # Playback investigation
│   └── reference/                 # Per-group command reference
│       ├── index.md               # Master index
│       ├── auth.md, config.md, user.md, music.md
│       ├── playlist.md, album.md, search.md
│       └── pipeline.md
├── tests/
├── .omo/notepads/                 # Agent knowledge base
│   └── netease-music-agent-cli-implementation/
│       ├── learnings.md           # Technical learnings
│       └── decisions.md           # Architecture decisions
└── package.json
```
