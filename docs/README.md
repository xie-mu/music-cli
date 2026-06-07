# NetEase Music CLI 文档体系

本文是仓库文档入口，用来说明当前文档分层、可信边界和维护方式。

## 推荐阅读顺序

1. [reference/index.md](reference/index.md) - CLI 命令总索引。查询命令、参数、示例时优先看这里。
2. [ARCHITECTURE.md](ARCHITECTURE.md) - 代码结构、核心模块、命令路由、网络与本地状态的架构说明。
3. [PLAYBACK_STRATEGY.md](PLAYBACK_STRATEGY.md) - 播放入口、Orpheus 桌面协议、浏览器 fallback 和不可验证边界。
4. [SMTC_CAPABILITY_SUPPORT.zh-CN.md](SMTC_CAPABILITY_SUPPORT.zh-CN.md) - Windows SMTC 能力边界，适合中文说明和产品判断。
5. [SMTC_CAPABILITY_SUPPORT.md](SMTC_CAPABILITY_SUPPORT.md) - Windows SMTC 能力边界的英文版。

## 文档分层

| 层级 | 文件 | 用途 | 维护方式 |
|---|---|---|---|
| 总入口 | `docs/README.md` | 文档导航、分层、可信边界 | 手写维护 |
| 架构说明 | `docs/ARCHITECTURE.md` | 解释模块分工、核心流程和目录结构 | 代码结构变化时同步 |
| 命令参考 | `docs/reference/index.md`, `docs/reference/*.md` | 命令、参数、全局选项、示例 | 命令表面变化时同步 |
| 播放策略 | `docs/PLAYBACK_STRATEGY.md` | 播放策略和历史验证结论 | 播放实现或验证结论变化时同步 |
| Windows 媒体能力 | `docs/SMTC_CAPABILITY_SUPPORT*.md` | SMTC 可读/可控/不可做能力边界 | SMTC helper 或命令能力变化时同步 |
| 历史调研 | `docs/LINUX_PLAYER_RESEARCH.md` | Linux 播放方案候选与历史调研 | 仅在继续 Linux 播放方案时更新 |
| Agent 使用说明 | `SKILL.md` | 给外部 Agent 使用本 CLI 的操作手册 | CLI 对外用法变化时同步 |

## 中英文对应情况

当前文档不是全量双语体系，而是按用途分配语言：命令参考保持英文权威文本，产品和本地验证边界优先保留中文说明，只有需要中英文共同引用的 SMTC 能力文档维护成对版本。

| 主题 | 中文文档 | 英文文档 | 当前状态 | 同步要求 |
|---|---|---|---|---|
| 文档入口 | `docs/README.md` | 无独立英文版 | 中文主文档，含英文文件名和术语 | 新增文档时更新本表 |
| 架构说明 | 无独立中文版 | `docs/ARCHITECTURE.md` | 英文主文档，架构图和部分术语含中文 | 模块边界变化时更新英文说明 |
| 命令参考 | 无独立中文版 | `docs/reference/index.md`, `docs/reference/*.md` | 英文权威参考 | 命令表面变化时更新英文参考 |
| 播放策略 | `docs/PLAYBACK_STRATEGY.md` | 无独立英文版 | 中文历史验证和策略说明 | 播放策略变化时更新中文说明 |
| Windows SMTC 能力 | `docs/SMTC_CAPABILITY_SUPPORT.zh-CN.md` | `docs/SMTC_CAPABILITY_SUPPORT.md` | 已成对，章节和能力表对齐 | 任一版本变化时同步另一版本 |
| Linux 播放调研 | `docs/LINUX_PLAYER_RESEARCH.md` | 无独立英文版 | 中文历史调研 | 继续 Linux 方案时更新中文说明 |
| Agent 使用说明 | 无独立中文版 | `SKILL.md` | 英文操作手册 | 对外 Agent 用法变化时更新 |

维护成对文档时，先改事实来源，再同步另一语言版本；如果只补一种语言，也要在本表或目标文档中说明另一个版本暂不维护，避免读者误以为缺失是遗漏。

## 可信边界

- 命令用法以 `docs/reference/index.md` 和对应的 `docs/reference/<group>.md` 为准。
- 已注册命令能力以 `src/main.ts` 的 `register(...)` 列表和 `nm --help` 为准。
- 代码结构以 `src/`、`tools/`、`tests/` 的当前文件为准，`docs/ARCHITECTURE.md` 是解释层。
- 播放实现以 `src/player.ts` 为准；文档只能描述策略和验证边界。
- Windows SMTC 实现边界在 `src/services/smtc.ts`、`src/commands/smtc.ts` 和 `tools/smtc_query.cs`。
- SMTC 控制成功只表示 Windows/客户端接受请求，不等于已经确认听到声音。
- Orpheus 或浏览器启动只表示入口已交给外部程序，不应描述成 CLI 已确认播放成功。

## 目录结构

```text
docs/
├── README.md                         # 文档体系入口
├── ARCHITECTURE.md                   # 架构说明
├── PLAYBACK_STRATEGY.md              # 播放策略与历史验证
├── SMTC_CAPABILITY_SUPPORT.md        # SMTC 能力边界，英文
├── SMTC_CAPABILITY_SUPPORT.zh-CN.md  # SMTC 能力边界，中文
├── LINUX_PLAYER_RESEARCH.md          # Linux 播放历史调研
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

## 更新检查清单

- 新增、删除、重命名命令：同步 `docs/reference/index.md` 和对应 group 文档。
- 新增全局参数或输出格式：同步 `docs/reference/index.md` 的 Global flags。
- 修改播放入口、fallback、`--no-open` 或 `--player`：同步 `docs/PLAYBACK_STRATEGY.md`。
- 修改 SMTC helper、会话选择、控制命令或诊断输出：同步 `docs/SMTC_CAPABILITY_SUPPORT*.md` 和 `docs/reference/smtc.md`。
- 修改模块边界或目录结构：同步 `docs/ARCHITECTURE.md`。
- 修改 Agent 对外使用方式：同步根目录 `SKILL.md`。
