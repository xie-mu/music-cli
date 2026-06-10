# NetEase Music CLI (`nm`)

[![npm](https://img.shields.io/npm/v/netease-music-cli)](https://www.npmjs.com/package/netease-music-cli)
[![License](https://img.shields.io/github/license/xie-mu/music-cli)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.12.0-brightgreen)](package.json)

> **NetEase Cloud Music AI Agent CLI** — 基于命令行的网易云音乐控制工具，专为 AI Agent 和终端用户设计。

`nm` 是一个功能完整的网易云音乐 CLI，支持搜索、播放、歌单管理、歌词同步、Windows SMTC 控制、本地队列、听歌报告、工作流编排等能力。同时提供面向 AI Agent 的 SKILL.md 指令手册和 Function Calling Schema，让 Agent 可直接通过命令行操作网易云音乐。

---

## 快速开始

```bash
npm install -g netease-music-cli
nm --version        # v1.2.0
nm auth login --qrcode   # 扫码登录
```

**要求：** Node.js ≥ 22.12.0

---

## 能力概览

| 能力 | 命令 |
|------|------|
| 🎵 **搜索歌曲** | `nm search --keyword <text>` |
| 📄 **歌曲信息** | `nm music info --id <id>` |
| 📜 **滚动歌词** | `nm music lyric --id <id> --sync` |
| ▶️ **播放推送** | `nm music play --id <id>` |
| 📋 **歌单管理** | `nm playlist show/list/summary/create/...` |
| 💿 **专辑浏览** | `nm album show/list/sub/unsub` |
| 📊 **用户分析** | `nm user profile/history/level` |
| 📈 **听歌报告** | `nm insight weekly/monthly/yearly` |
| 🗂️ **播放队列** | `nm queue add/list/play/next` |
| 🔄 **工作流编排** | `nm pipeline run <file.yaml>` |
| 🪟 **SMTC 控制** | `nm smtc status/play/pause/next/prev/...` |
| 🩺 **诊断检查** | `nm doctor` |
| 🤖 **Agent 协议** | `nm config export-schema` |

**完整命令列表：** 75 个命令，17 个分组 → [docs/reference/index.md](docs/reference/index.md)

---

## 文档体系

| 文档 | 说明 |
|------|------|
| **[SKILL.md](SKILL.md)** | 📘 AI Agent 指令手册 — 最高优先级路由表 + 鉴权 + 工作流模式 |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | 🏗️ 系统架构 — 加密层/路由/SMTC/Pipeline |
| **[docs/reference/index.md](docs/reference/index.md)** | 📖 命令参考总索引 — 全命令速查 + 分组 + 全局 Flags |
| **[docs/reference/*.md](docs/reference/)** | 📑 逐组命令详情 — Options 表 + 示例 |
| **[docs/PLAYBACK_STRATEGY.md](docs/PLAYBACK_STRATEGY.md)** | 🎧 播放策略 — Orpheus 协议 + 浏览器回退 + 验证边界 |
| **[docs/SMTC_CAPABILITY_SUPPORT.zh-CN.md](docs/SMTC_CAPABILITY_SUPPORT.zh-CN.md)** | 🪟 Windows SMTC 能力边界 |

### 架构分层

```
┌─ Layer 1: Agent 指令路由 ─────┐
│  SKILL.md (14 节)              │  ← AI Agent 操作手册
├─ Layer 2: 命令参考文档 ────────┤
│  docs/reference/* (16 文件)     │  ← 标准模板，人和 Agent 共用
├─ Layer 3: CLI 实现层 ──────────┤
│  src/ (75 命令, 17 分组)        │  ← TypeScript 源码
└─ Layer 4: 支撑文档 ────────────┤
   ARCHITECTURE + PLAYBACK + SMTC  │  ← 设计决策记录
```

---

## 鉴权

网易云音乐需要登录才能使用用户相关功能。支持两种登录方式：

```bash
nm auth login --qrcode              # 推荐：扫码登录
nm auth login --phone <num> --password <pwd>  # 手机号登录
nm auth status                       # 检查登录状态
nm auth logout                       # 退出登录
```

凭证保存在 `~/.netease-music/cookie.json`。

**无需登录的命令：** `search`, `music info/lyric/url`, `playlist show/play/tracks/summary`, `album show`, `toplist`, `queue *`, `memory *`, `smtc *`, `nowplaying`, `pipeline`, `doctor`

---

## 功能示例

### 搜索 & 播放

```bash
nm search --keyword "告五人"
nm music info --id 1807799505
nm music play --id 1807799505
nm music lyric --id 1807799505 --sync   # 滚动同步歌词
```

### 歌单分析

```bash
nm playlist show --id 3778678           # 热歌榜详情
nm playlist summary --id 3778678        # 统计分布
nm playlist audit --id 3778678          # 重复检查
```

### Windows SMTC 控制

```bash
nm smtc status                          # 查看当前播放
nm smtc play/pause/next/prev            # 控制播放
nm smtc seek --position 60              # 跳转到60秒
```

### 工作流编排

```bash
nm pipeline validate scenarios/playlist-report.yaml
nm pipeline run scenarios/playlist-report.yaml --input '{"playlistId":"3778678"}'
```

---

## 项目结构

```
netease-music-cli/
├── SKILL.md                  # AI Agent 指令手册
├── src/
│   ├── main.ts               # 入口 + 75 个命令注册
│   ├── router.ts             # Trie 树命令路由
│   ├── config.ts             # 3 层配置合并 (file→env→flags)
│   ├── crypto.ts             # eapi 加密引擎
│   ├── player.ts             # Orpheus/浏览器播放 handoff
│   ├── commands/             # 17 组命令实现
│   ├── services/             # 网易云 API 封装
│   ├── pipeline/             # DAG 工作流引擎
│   └── state/                # 本地队列/记忆存储
├── docs/
│   ├── ARCHITECTURE.md       # 系统架构
│   ├── PLAYBACK_STRATEGY.md  # 播放策略
│   ├── SMTC_CAPABILITY*.md   # SMTC 能力边界
│   └── reference/            # 命令参考文档 (16 文件)
├── tools/
│   └── smtc_query.cs         # Windows SMTC helper
└── tests/                    # 39 个测试用例
```

---

## 认证 & 许可

本项目基于对网易云音乐 Web API 的反向工程实现，不涉及任何版权内容的解密或分发。所有播放操作均通过网易云官方桌面客户端或网页播放器完成。

MIT License — 详见 [LICENSE](LICENSE)

---

## 相关链接

- [npm: netease-music-cli](https://www.npmjs.com/package/netease-music-cli)
- [网易云音乐](https://music.163.com/)
