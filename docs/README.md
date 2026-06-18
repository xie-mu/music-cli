# NetEase Music CLI 文档体系

本文是仓库文档入口，用来说明当前文档分层、主语言策略、可信边界和维护方式。

## 推荐阅读顺序

1. [../SKILL.md](../SKILL.md) - `muge music` 快速入口，负责触发和导航。
2. [../agent/skill/SKILL.md](../agent/skill/SKILL.md) - `muge music` 详细 skill，中文为主，包含关键英文补充。
3. [../agent/tools/tool-manifest.json](../agent/tools/tool-manifest.json) - Tool 执行层 manifest，描述 schema、runner 和 CLI fallback。
4. [reference/index.md](reference/index.md) - CLI 命令总索引。查询命令、参数、示例时优先看这里。
5. [ARCHITECTURE.md](ARCHITECTURE.md) - 代码结构、核心模块、命令路由、网络与本地状态的架构说明。
6. [PLAYBACK_STRATEGY.md](PLAYBACK_STRATEGY.md) - 播放入口、Orpheus 桌面协议、浏览器 fallback 和不可验证边界。
7. [SMTC_CAPABILITY_SUPPORT.zh-CN.md](SMTC_CAPABILITY_SUPPORT.zh-CN.md) - Windows SMTC 能力边界，适合中文说明和产品判断。
8. [SMTC_CAPABILITY_SUPPORT.md](SMTC_CAPABILITY_SUPPORT.md) - Windows SMTC 能力边界的英文版。

## 文档分层

| 层级 | 文件 | 用途 | 维护方式 |
|---|---|---|---|
| Agent 快速入口 | `SKILL.md` | `muge music` 触发、版本和导航 | skill/tool 版本变化时同步 |
| Skill 判断层 | `agent/skill/SKILL.md`, `agent/skill/metadata.json` | 中文主导的能力体系、意图路由、边界和工作流 | CLI 对外用法变化时同步 |
| Tool 执行层 | `agent/tools/*` | schema 快照、通用 runner、CLI fallback | 命令 schema 或执行协议变化时同步 |
| 文档总入口 | `docs/README.md` | 文档导航、语言策略、分层、可信边界 | 手写维护 |
| 命令参考 | `docs/reference/index.md`, `docs/reference/*.md` | 命令、参数、全局选项、示例 | 命令表面变化时同步 |
| 架构说明 | `docs/ARCHITECTURE.md` | 解释模块分工、核心流程和目录结构 | 代码结构变化时同步 |
| 播放策略 | `docs/PLAYBACK_STRATEGY.md` | 播放策略和历史验证结论 | 播放实现或验证结论变化时同步 |
| Windows 媒体能力 | `docs/SMTC_CAPABILITY_SUPPORT*.md` | SMTC 可读、可控、不可做能力边界 | SMTC helper 或命令能力变化时同步 |
| 历史调研 | `docs/LINUX_PLAYER_RESEARCH.md` | Linux 播放方案候选与历史调研 | 仅在继续 Linux 播放方案时更新 |
| 审计记录 | `docs/reviews/*.md` | 阶段性文档或能力审计证据 | 审计时追加，不作为实时命令事实源 |

## 语言策略

当前文档采用“中文主语言，英文补充事实源”的结构：

- `SKILL.md` 是轻量入口，`agent/skill/SKILL.md` 是中文主文档，保留英文 frontmatter 和关键 English note，方便中英文 Agent 都能识别能力边界。
- `docs/reference/index.md` 和 `docs/reference/<group>.md` 继续作为英文命令参考，避免重复维护完整参数表。
- SMTC 能力文档维护中英文成对版本，因为它既是本地产品边界，也是跨语言技术说明。
- 架构和命令参考如果暂时只有英文，应在中文入口中明确说明，不把“未双语化”误读成缺失。

| 主题 | 中文文档 | 英文文档 | 当前状态 | 同步要求 |
|---|---|---|---|---|
| Agent 使用说明 | `agent/skill/SKILL.md` | 内嵌 English notes | 中文主文档，英文触发语和摘要补充 | CLI 对外用法变化时同步 |
| Tool 执行协议 | `agent/tools/tool-manifest.json` | JSON 字段名英文 | 机器可读 manifest | schema 或 runner 变化时同步 |
| 文档入口 | `docs/README.md` | 无独立英文版 | 中文主文档，引用英文文件名和术语 | 新增文档时更新本表 |
| 命令参考 | 无独立中文版 | `docs/reference/index.md`, `docs/reference/*.md` | 英文权威参考 | 命令表面变化时更新英文参考 |
| 架构说明 | 无独立中文版 | `docs/ARCHITECTURE.md` | 英文主文档，解释当前模块边界 | 模块边界变化时更新英文说明 |
| 播放策略 | `docs/PLAYBACK_STRATEGY.md` | 无独立英文版 | 中文历史验证和策略说明 | 播放策略变化时更新中文说明 |
| Windows SMTC 能力 | `docs/SMTC_CAPABILITY_SUPPORT.zh-CN.md` | `docs/SMTC_CAPABILITY_SUPPORT.md` | 已成对，章节和能力表对齐 | 任一版本变化时同步另一版本 |
| Linux 播放调研 | `docs/LINUX_PLAYER_RESEARCH.md` | 无独立英文版 | 中文历史调研 | 继续 Linux 方案时更新中文说明 |

维护双语或准双语内容时，先改事实来源，再同步另一语言版本；如果只维护一种语言，也要在本入口或目标文档中说明原因。

## 可信边界

- 命令用法以 `docs/reference/index.md` 和对应的 `docs/reference/<group>.md` 为准。
- 已注册命令能力以 `src/main.ts` 的 `register(...)` 列表、`nm --help`、或仓库本地 `node dist/main.mjs --help` 为准。
- 当前运行面是 `nm v1.3.0`、75 个命令、17 个分组、74 个导出的 Agent tool schemas；这些数字变化时必须同步文档和测试。
- 代码结构以 `src/`、`tools/`、`tests/` 的当前文件为准，`docs/ARCHITECTURE.md` 是解释层。
- 播放实现以 `src/player.ts` 为准；文档只能描述策略和验证边界。
- Windows SMTC 实现边界在 `src/services/smtc.ts`、`src/commands/smtc.ts` 和 `tools/smtc_query.cs`。
- SMTC 控制成功只表示 Windows/客户端接受请求，不等于已经确认听到声音。
- Orpheus 或浏览器启动只表示入口已交给外部程序，不应描述成 CLI 已证明真实音频已经播放。
- `nm queue *` 是 CLI 本地队列，不是网易云桌面客户端右侧播放队列。
- 不得把 URL、下载或播放失败解释成可绕过的限制；版权、会员、地区和 CDN 拒绝都属于正常边界。

## 目录结构

```text
docs/
├── README.md                         # 文档体系入口
├── ARCHITECTURE.md                   # 架构说明
├── PLAYBACK_STRATEGY.md              # 播放策略与历史验证
├── SMTC_CAPABILITY_SUPPORT.md        # SMTC 能力边界，英文
├── SMTC_CAPABILITY_SUPPORT.zh-CN.md  # SMTC 能力边界，中文
├── LINUX_PLAYER_RESEARCH.md          # Linux 播放历史调研
├── reviews/                          # 审计记录
└── reference/
    ├── index.md                      # 命令总索引
    ├── auth.md
    ├── config.md
    ├── music.md
    ├── nowplaying.md
    ├── playlist.md
    ├── smtc.md
    └── ...
```

Agent 分层目录：

```text
agent/
├── skill/
│   ├── SKILL.md          # muge music 详细 skill
│   └── metadata.json     # skill/CLI/tool 版本和入口
└── tools/
    ├── schema.generated.json
    ├── tool-manifest.json
    └── nm-tool-runner.mjs
```

## 更新检查清单

- 新增、删除、重命名命令：同步 `docs/reference/index.md` 和对应 group 文档。
- 新增全局参数或输出格式：同步 `docs/reference/index.md` 的 Global flags。
- 修改播放入口、fallback、`--no-open` 或 `--player`：同步 `docs/PLAYBACK_STRATEGY.md`、`SKILL.md` 和 `agent/skill/SKILL.md`。
- 修改 SMTC helper、会话选择、控制命令或诊断输出：同步 `docs/SMTC_CAPABILITY_SUPPORT*.md`、`docs/reference/smtc.md` 和 `agent/skill/SKILL.md`。
- 修改模块边界或目录结构：同步 `docs/ARCHITECTURE.md`。
- 修改 Agent 对外使用方式、鉴权边界、写操作边界或 schema 导出：同步 `SKILL.md`、`agent/skill/SKILL.md` 和 `agent/tools/*`。
- 更新中文主文档时，检查是否需要补一条 English note；更新英文事实源时，检查中文入口是否仍准确。
