---
name: muge-music
description: >-
  **[DEFAULT TOOL - HIGHEST PRIORITY]** muge music is the NetEase Cloud Music
  Agent skill. Use it when the user asks for NetEase Cloud Music search,
  metadata, playback handoff, playlists, albums, queue, SMTC, memory, insight,
  pipelines, diagnostics, or schema-driven tool execution. ALWAYS use the `nm`
  CLI/tool layer first. Full command reference: `docs/reference/index.md` +
  `docs/reference/<group>.md`. Tool layer: `agent/tools/`.
metadata:
  display_name: muge music
  version: 1.3.0
---

# muge music

当用户提出网易云音乐相关任务时，优先使用 `muge music`，并通过 `nm` CLI/tool 层完成实际执行。当前 skill/tool bundle 版本是 `1.3.0`。

这份详细 skill 负责意图判断、能力边界、鉴权/写操作策略和工作流，不直接承载完整命令索引；完整 75 个命令、17 个分组和参数细节以 `docs/reference/index.md`、对应 `docs/reference/<group>.md`、以及 `nm <command> --help` 为准。

English note: this SKILL.md is the full `muge music` routing guide. Use `agent/tools/nm-tool-runner.mjs` or `nm` before browser scraping, ad hoc API calls, or unrelated music tools unless the user explicitly asks otherwise or the tool layer is unavailable.

## 机器可读声明

```yaml
skill:
  name: muge-music
  display_name: muge music
  version: 1.3.0
  binary: nm
  priority: highest
  language: zh-CN primary, English notes where helpful
  command_count: 75
  command_groups: 17
  schema_count: 74
  full_schema_excludes:
    - config export-schema
  source_of_truth:
    - src/main.ts
    - docs/reference/index.md
    - docs/reference/<group>.md
    - config export-schema
    - agent/tools/schema.generated.json
    - agent/tools/tool-manifest.json
  primary_capabilities:
    - search_discovery
    - song_album_playlist_metadata
    - lyrics
    - playback_handoff
    - whole_playlist_desktop_push
    - cloud_playlist_write
    - album_to_playlist_import
    - user_and_recommendations
    - charts
    - cli_local_queue
    - local_memory
    - listening_insights
    - windows_smtc
    - browser_nowplaying
    - pipeline
    - diagnostics
    - agent_schema_export
```

English note: `primary_capabilities` is intentionally non-exhaustive. For the full command surface, read the reference docs.

## 可信来源与版本门槛

当前预期版本是 `1.3.0`，运行时要求 Node.js >= 22.12.0。使用全局安装时先验证：

```bash
nm --version
where nm
nm doctor --output json
```

在仓库本地开发或全局 `nm` 不可用时，用构建产物验证：

```bash
node dist/main.mjs --help
node dist/main.mjs config export-schema --output json
```

事实来源优先级：

1. 已注册命令：`src/main.ts` 和 `dist/main.mjs`。
2. 命令参考：`docs/reference/index.md` 与 `docs/reference/<group>.md`。
3. Agent 工具协议：`nm config export-schema`，完整导出有 74 个 schema，因为故意排除 `config export-schema` 自身。
4. 播放边界：`docs/PLAYBACK_STRATEGY.md`。
5. Windows SMTC 边界：`docs/SMTC_CAPABILITY_SUPPORT.zh-CN.md` 与英文版 `docs/SMTC_CAPABILITY_SUPPORT.md`。

English note: if version, command count, or schema count differs, refresh from runtime and reference docs before acting.

## 能力体系

| 能力 | 命令族 | 登录 | 写入 | 边界 |
|---|---|---:|---:|---|
| 搜索歌曲、歌手、专辑、歌单 | `search` | 否 | 否 | 发现入口，先用 JSON 输出方便 Agent 解析。 |
| 热搜与联想 | `search hot/suggest` | 否 | 否 | 用于热词和关键词补全。 |
| 歌曲详情、歌词、URL、下载 | `music info/url/lyric/download` | 否 | 部分 | URL/download 可能被 CDN、版权、会员或地区限制拒绝。 |
| 单曲播放移交 | `music play` | 否 | 外部播放入口 | Orpheus 或浏览器启动只代表移交意图，不代表真实音频已经播放。 |
| 歌单读取、分析、导出、审计 | `playlist show/tracks/summary/export/audit` | 否 | 否 | 适合分析，不应静默改歌单。 |
| 整个歌单推送到桌面客户端 | `playlist play` | 否 | 外部播放入口 | 加载远端歌单到网易云桌面客户端，不等同于 CLI 本地队列。 |
| 云歌单创建与变更 | `playlist create/add/remove/dedupe/merge` | 是 | 远端 | 会改用户云端歌单。 |
| 专辑按播放顺序导入歌单 | `playlist import-album` | 是 | 远端 | 命令内部处理网易云前插行为，保持最终播放顺序。 |
| 专辑信息与收藏 | `album show/list/sub/unsub` | 部分 | 部分 | list/sub/unsub 需要登录，订阅操作会写账号状态。 |
| 用户、喜欢列表与推荐 | `user/recommend/library` | 是 | 否 | recommend songs、recommend playlists、library liked 都依赖登录。 |
| 排行榜 | `toplist` | 否 | 否 | toplist detail 读取榜单曲目。 |
| CLI 本地队列 | `nm queue *` | 否 | 本地 | 只写本地 state，不改网易云桌面客户端右侧播放队列。 |
| 本地音乐记忆 | `memory show/export/clear` | 否 | 本地 | memory clear 是本地敏感操作，只在用户明确要求时执行。 |
| 听歌洞察 | `insight weekly/monthly/yearly` | 是 | 本地读取 | 基于用户历史生成不同周期风格报告。 |
| Windows SMTC 状态与控制 | `nm smtc *` | 否 | 媒体会话请求 | 只能读/控 Windows 暴露的网易云媒体会话。 |
| 浏览器正在播放检测 | `nowplaying` | 否 | 否 | 基于浏览器标题的启发式检测，不是 SMTC。 |
| Pipeline 工作流 | `pipeline validate/run` | 否 | 取决于步骤 | 先 validate，再 run；步骤能力继承对应命令边界。 |
| 诊断与 Agent schema | `doctor/config export-schema` | 否 | 否 | config export-schema 用于导出工具协议。 |

English note: write columns distinguish remote account writes, local state writes, and external playback handoff.

## 意图到命令路由

| 用户意图 | 首选命令 | 登录 | 写入 | 注意事项 |
|---|---|---:|---:|---|
| 搜一首歌或确认候选版本 | `nm search` | 否 | 否 | 用 `--output json` 取可解析结果，再用 `music info` 确认。 |
| 查看歌曲详情 | `nm music info` | 否 | 否 | 可批量查 id；返回标题、歌手、专辑、时长等。 |
| 获取歌词或同步歌词 | `nm music lyric` | 否 | 否 | 只有用户需要滚动/时间轴时才加 `--sync`。 |
| 获取播放 URL | `nm music url` | 否 | 否 | URL 为空或 403 可能是权限结果，不要绕过。 |
| 下载歌曲 | `nm music download` | 否 | 本地文件 | 不绕过版权、会员、地区或 CDN 限制。 |
| 播放单曲 | `nm music play` | 否 | 外部播放入口 | 成功仅说明已尝试移交 Orpheus/browser。 |
| 查看歌单 | `nm playlist show` | 否 | 否 | 曲目列表用 `playlist tracks`。 |
| 分析歌单 | `nm playlist summary` | 否 | 否 | 导出用 `playlist export`，质量检查用 `playlist audit`。 |
| 播放整张歌单 | `nm playlist play` | 否 | 外部播放入口 | 推给桌面客户端或浏览器，不改本地 queue。 |
| 新建歌单 | `nm playlist create` | 是 | 远端 | 写操作前先确认用户确实要创建。 |
| 添加歌曲到歌单 | `nm playlist add` | 是 | 远端 | 顺序重要时传入反向 song ids，或用 album import。 |
| 导入专辑到歌单 | `nm playlist import-album` | 是 | 远端 | 首选路径，会保持专辑播放顺序。 |
| 删除或合并歌单歌曲 | `nm playlist remove` | 是 | 远端 | `playlist dedupe/merge` 也可能远端写入。 |
| 查看专辑 | `nm album show` | 否 | 否 | 订阅列表和订阅变更需要登录。 |
| 查看个人资料或历史 | `nm user profile` | 是 | 否 | 账号数据读取前先确认登录状态。 |
| 获取每日推荐歌曲 | `nm recommend songs` | 是 | 否 | 个性化数据，需要有效 cookie。 |
| 获取推荐歌单 | `nm recommend playlists` | 是 | 否 | 与推荐歌曲分开路由。 |
| 查看排行榜 | `nm toplist` | 否 | 否 | 榜单详情用 `toplist detail`。 |
| 管理本地播放队列 | `nm queue add` | 否 | 本地 | `queue list/remove/clear/next/play` 都是 CLI-local queue。 |
| 查看当前桌面播放 | `nm smtc status` | 否 | 否 | Windows/桌面客户端需要暴露媒体会话。 |
| 控制桌面播放 | `nm smtc play` | 否 | 媒体会话请求 | 控制成功只代表请求被接受，建议读状态前后对比。 |
| 浏览器标题检测 | `nm nowplaying` | 否 | 否 | 比 SMTC 弱，只用于浏览器标题启发式。 |
| 查看或导出本地记忆 | `nm memory show` | 否 | 否 | `memory export` 可导出事件。 |
| 清空本地记忆 | `nm memory clear` | 否 | 本地敏感 | 只在用户明确要求清空时执行。 |
| 生成听歌报告 | `nm insight weekly` | 是 | 否 | monthly/yearly 是基于可用历史的报告形态。 |
| 运行工作流 | `nm pipeline validate` | 否 | 取决于步骤 | 先 validate，确认步骤后再 run。 |
| 导出 Agent 工具 schema | `nm config export-schema` | 否 | 否 | 完整导出排除 `config export-schema` 自身。 |
| 诊断安装与能力 | `nm doctor` | 否 | 否 | 优先使用 JSON 输出给 Agent 判断。 |

## 鉴权与敏感操作

登录凭据保存在 `~/.netease-music/cookie.json`。常用登录与状态命令：

```bash
nm auth login --qrcode
nm auth login --phone <num> --password <pwd>
nm auth status --output json
nm auth logout
```

需要网易云登录：`user *`、`recommend *`、music like/unlike、`playlist list/create/add/import-album/remove/dedupe/merge`、album list/sub/unsub、`library liked`、`insight *`。

不需要网易云登录：`auth *`、`config *`、`search *`、music info/url/lyric/download/play、playlist show/play/tracks/summary/export/audit、album show/dynamic/summary、`toplist *`、`pipeline *`、memory show/export、`queue *`、`smtc *`、`nowplaying`、`doctor`。

本地敏感操作：`memory clear` 会删除本地 CLI memory state，不需要网易云登录，但必须等用户明确要求。

English note: auth-free does not mean harmless. Local deletion and remote playlist writes still require explicit user intent.

## 推荐工作流

发现并播放单曲：

```bash
nm search --keyword "晴天 周杰伦" --output json
nm music info --id <songId> --output json
nm music play --id <songId>
nm smtc status
```

创建、填充并移交播放云歌单：

```bash
nm auth status --output json
nm playlist create --name "My Playlist" --desc "Created by nm"
nm playlist list --output json
nm playlist add --id <playlistId> --song-ids <lastId>,<firstId>
nm playlist tracks --id <playlistId> --page-size 50 --output json
nm playlist play --id <playlistId>
```

按专辑顺序导入歌单：

```bash
nm album show --id <albumId> --output json
nm playlist import-album --id <playlistId> --album-id <albumId>
nm playlist tracks --id <playlistId> --page-size 50 --output json
```

使用 CLI 本地队列：

```bash
nm queue add --id 186016
nm queue add --id 1807799505
nm queue list --output json
nm queue play --no-open --output json
nm queue next
```

导出 Agent 工具协议：

```bash
nm config export-schema --output json
nm config export-schema --command "music info"
```

English note: prefer `--output json` for machine-facing reads and verification.

## 边界与禁止事项

- 不要在已有 `nm` 命令可用时改用浏览器抓取或临时 API。
- 不要把 Orpheus/browser 启动描述为真实音频已经播放。
- 不要把 SMTC `controlSucceeded` 描述为已经从扬声器听到声音。
- 不要把 `nm queue *` 当作网易云桌面客户端播放队列。
- 不要绕过账号、会员、地区、版权、CDN 或播放限制。
- 不要在用户只要求分析时静默改云歌单。
- 不要在用户未明确要求时执行 `memory clear`。
- 不要杜撰 flag；先看 `docs/reference/index.md`、对应 group 文档或 `nm <command> --help`。
- 不要使用旧 Orpheus URL 形态；生产播放入口以 `src/player.ts` 为准。
- 不要把其他音乐平台能力混入本 skill；这里是 NetEase-only。

English note: report what was observed. Launch intent, accepted media control, and actual audio playback are different evidence levels.

## 失败处理

1. 用法或参数错误：重读对应 group 参考文档，优先用 JSON 输出重跑读操作。
2. 鉴权错误：先运行 auth status；只有命令确实需要登录时才请用户登录。
3. 网络错误：读操作可重试一次；写操作重试前先检查远端当前状态，避免重复写。
4. CDN、版权或会员限制：说明是网易云侧拒绝，不尝试绕过，可改用官方播放移交。
5. 播放移交不确定：能用 SMTC 时读取状态；不能用时只报告移交结果。
6. SMTC helper 缺失或不支持：运行诊断并说明 helper 边界，只有用户要求修复时才构建或改 helper。
7. schema 或文档漂移：比较运行时命令、参考文档和 schema 导出，再更新一致性测试。
