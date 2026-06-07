# 网易云 SMTC 能力支持文档

> 状态：当前 SMTC helper 的能力边界和已实现 CLI 表面。
> 日期：2026-06-06
> English version: [SMTC_CAPABILITY_SUPPORT.md](SMTC_CAPABILITY_SUPPORT.md)

## 范围

本文中的 SMTC 指 Windows System Media Transport Controls，主要通过
`Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager`
暴露系统媒体会话能力。

对于网易云音乐，SMTC 是操作系统层面的本机媒体会话接口。它可以在网易云音乐桌面客户端向 Windows 发布媒体会话时，观察该会话并请求执行常规媒体控制。它不是网易云 Web API，不是播放流接口，也不能替代需要鉴权的网易云曲库和账号 API。

## 能力支持概览

| 能力 | 支持情况 | 说明 |
|---|---:|---|
| 检测活跃媒体会话 | 支持 | SMTC 可以列出系统当前可见的媒体会话，并读取当前会话。 |
| 识别网易云会话 | 部分支持 | 可通过 `SourceAppUserModelId` 或应用标识中是否包含 `cloudmusic`、`netease`、`orpheus` 等字符串判断；这是启发式识别，不是网易云官方契约。 |
| 读取当前歌曲标题 | 支持 | 取决于网易云客户端是否发布媒体属性。 |
| 读取歌手 | 支持 | 取决于网易云客户端是否发布媒体属性。 |
| 读取专辑名 | 支持 | 取决于网易云客户端是否发布媒体属性。 |
| 读取播放状态 | 支持 | 常见状态包括 `Playing`、`Paused`、`Stopped`、`Unknown`。 |
| 读取播放进度和时长 | 支持 | 通过时间线属性获取；前提是客户端发布了这些数据。 |
| 读取控制可用性 | 部分支持 | SMTC 会暴露控制标记，但客户端仍可能拒绝具体控制请求。 |
| 播放 / 暂停 / 切换播放暂停 | 支持 | 这是向媒体会话发送请求；成功仅表示 SMTC 或客户端接受了请求，不代表已确认听到声音。 |
| 下一首 / 上一首 | 支持 | 取决于网易云会话是否启用跳转控制。 |
| 停止播放 | 部分支持 | SMTC 支持 stop，但音乐客户端可能忽略，或把 stop 处理成 pause。 |
| 跳转到指定进度 | 部分支持 | 需要有效时间线，也需要网易云会话接受 seek 请求。 |
| 监听状态变化 | 部分支持 | 可以通过轮询实现；SMTC 原生也有事件，但 CLI 场景通常更适合短进程轮询。 |
| 获取网易云歌曲 ID | 不支持 | SMTC 媒体属性不暴露网易云 song id。 |
| 获取播放队列或歌单详情 | 不支持 | SMTC 只暴露当前媒体会话，不暴露网易云曲库或队列结构。 |
| 获取歌词 | 不支持 | 歌词应走网易云元数据 API，不应走 SMTC。 |
| 获取音源 URL 或下载流 | 不支持 | SMTC 不暴露媒体流，也不应用于绕过播放、版权或会员限制。 |
| 喜欢、取消喜欢、收藏、评论、账号操作 | 不支持 | 这些属于网易云账号或业务 API，不属于 SMTC。 |
| 按网易云歌曲 ID 打开指定歌曲 | 不支持 | SMTC 只能控制已存在的媒体会话，不能把客户端导航到任意歌曲。 |

## 读取能力

### 会话发现

SMTC 可以请求 `GlobalSystemMediaTransportControlsSessionManager`，然后读取：

- 当前所有可见的系统媒体会话；
- 系统当前媒体会话；
- 每个会话的来源应用标识。

在本项目中，可以通过来源应用标识匹配网易云相关字符串来选择目标会话。这对本地工具很有用，但不能视作网易云的稳定公开契约。客户端包名、桥接名或应用标识未来都有可能变化。

### 媒体元数据

SMTC 媒体属性可能暴露：

- 标题；
- 歌手；
- 专辑名；
- 专辑歌手；
- 流派；
- 副标题；
- 缩略图；
- 曲目序号和专辑曲目总数；
- 播放类型。

当前本地 SMTC helper 映射 CLI 状态输出最需要的字段，包括 title、artist、album、播放状态、时间线、会话暴露的控制能力，以及可选的扩展媒体属性。即便如此，这些字段仍应视为可选能力，因为网易云客户端不一定稳定发布。

### 播放信息

SMTC 可以读取调用时刻的播放信息：

- 播放状态；
- 会话声明的播放控制能力；
- 时间线当前位置；
- 时间线开始和结束时间，可归一化为播放时长。

因此，SMTC 很适合做 `now playing` 类状态输出和状态轮询。它不适合做严格播放验证，因为 CLI 看到的是 SMTC 会话状态，而不是真实音频链路。

## 控制能力

SMTC 可以向选中的网易云媒体会话发送请求式控制操作：

| 操作 | SMTC 支持 | CLI 适配度 | 注意事项 |
|---|---:|---:|---|
| 播放 | 支持 | 高 | 只能确认请求被接受。 |
| 暂停 | 支持 | 高 | 只能确认请求被接受。 |
| 切换播放/暂停 | 支持 | 高 | 结果取决于当前状态和客户端行为。 |
| 下一首 | 支持 | 高 | 需要网易云会话暴露下一首控制。 |
| 上一首 | 支持 | 高 | 需要网易云会话暴露上一首控制。 |
| 停止 | 支持 | 中 | 音乐客户端可能忽略 stop，或映射为 pause。 |
| 跳转到指定进度 | 支持 | 中 | 需要有效时间线和可 seek 的会话。 |
| 改变播放速率 | SMTC 支持 | 低 | 对网易云音乐播放通常没有明显价值。 |
| 随机/循环 | SMTC 支持 | 低 | 客户端支持不确定，且可能不同步网易云业务状态。 |
| 快进/快退 | SMTC 支持 | 低 | 更适合视频或播客客户端，不是歌曲播放的核心场景。 |
| 录制/频道类控制 | SMTC 支持 | 不适用 | 不属于网易云音乐播放场景。 |

控制结果必须谨慎表述。布尔型 accepted 或 `controlSucceeded` 只表示 Windows 媒体会话或客户端接受了请求，不证明音频已经开始、停止，或已经从扬声器播放出来。

## 当前 CLI 表面

当前已实现的命令表面保持为窄接口：

| 命令 | 用途 | 输出 |
|---|---|---|
| `nm smtc status` | 读取当前网易云 SMTC 会话。 | 当前曲目、应用、状态、进度、时长。 |
| `nm smtc status --all` | 同时包含所有活跃系统媒体会话。 | 网易云目标会话，加上其他会话用于诊断。 |
| `nm smtc status --watch` | 持续轮询状态，直到用户中断。 | 文本流或重复 JSON 快照。 |
| `nm smtc sessions` | 列出活跃 Windows 媒体会话。 | 带应用标识和当前元数据的会话列表。 |
| `nm smtc play` | 请求网易云会话播放。 | 请求结果和刷新后的会话状态。 |
| `nm smtc pause` | 请求网易云会话暂停。 | 请求结果和刷新后的会话状态。 |
| `nm smtc toggle` | 请求播放/暂停切换。 | 请求结果和刷新后的会话状态。 |
| `nm smtc next` | 请求下一首。 | 请求结果和刷新后的会话状态。 |
| `nm smtc prev` | 请求上一首。 | 请求结果和刷新后的会话状态。 |
| `nm smtc stop` | 请求停止。 | 请求结果和刷新后的会话状态。 |
| `nm smtc seek --position <seconds>` | 请求跳转到绝对秒数位置。 | 请求结果和刷新后的会话状态。 |
| `nm smtc rate --value <rate>` | 请求改变播放速率。 | 请求结果和刷新后的会话状态。 |
| `nm smtc shuffle --enabled <true\|false>` | 请求改变随机播放状态。 | 请求结果和刷新后的会话状态。 |
| `nm smtc repeat --mode <none\|one\|all>` | 请求改变循环模式。 | 请求结果和刷新后的会话状态。 |
| `nm smtc fast-forward` | 请求快进状态。 | 请求结果和刷新后的会话状态。 |
| `nm smtc rewind` | 请求快退状态。 | 请求结果和刷新后的会话状态。 |

面向机器读取的输出应支持 JSON。一个稳定的归一化结构可以是：

```json
{
  "ok": true,
  "source": "smtc",
  "playing": true,
  "action": "play",
  "controlSucceeded": true,
  "session": {
    "sourceAppUserModelId": "...",
    "appName": "...",
    "isNetease": true,
    "song": {
      "title": "...",
      "artist": "...",
      "album": "..."
    },
    "playbackStatus": "Playing",
    "position": 42,
    "duration": 210,
    "canControl": true
  }
}
```

常见失败状态应保持显式：

| Reason | 含义 |
|---|---|
| `unsupported_platform` | 当前主机不是 Windows。 |
| `helper_missing` | Windows helper 可执行文件或等价桥接工具不可用。 |
| `no_active_session` | Windows 没有报告任何活跃媒体会话。 |
| `no_netease_session` | 存在媒体会话，但没有匹配到网易云。 |
| `invalid_position` | seek 位置缺失或非法。 |
| `invalid_rate` | 播放速率缺失或非法。 |
| `invalid_shuffle` | shuffle 值缺失或非法。 |
| `invalid_repeat_mode` | repeat 模式不在 `none`、`one`、`all` 范围内。 |
| `unknown_action` | 控制动作不在支持范围内。 |
| `helper_no_json` / `helper_invalid_json` | helper 没有返回可解析的结构化输出。 |

## 产品边界

SMTC 应视为本机用户会话能力：

- 只有在用户位于 Windows，且网易云客户端存在活跃 SMTC 媒体会话时才可用。
- 不应要求或收集网易云 Cookie。
- 不应下载音频、不应暴露音源 URL、不应绕过 DRM、不应绕过付费内容限制。
- 不应宣称已真实验证播放。CLI 可以报告会话状态和控制请求是否被接受，但不能确认真实音频输出。
- 它应该补充现有 Orpheus 或浏览器播放移交流程，而不是替代网易云曲库 API 或账号 API。

## 推荐使用场景

1. 查询本机网易云桌面客户端的 `now playing` 状态。
2. 控制已经活跃的本机网易云媒体会话。
3. 播放移交后的诊断：Windows 是否已经看到网易云会话、可见的曲目信息是什么、当前状态是什么。
4. 为本地自动化或面板提供 agent 友好的 JSON 轮询输出。

## 不推荐使用场景

1. 按任意网易云歌曲 ID 启动播放。
2. 仅根据 SMTC 元数据反推出网易云歌曲 ID。
3. 基于 SMTC 构建队列、歌单、专辑、歌词或账号功能。
4. 把 `controlSucceeded: true` 当作音乐已经真实播放的证明。
5. 在非 Windows 平台上依赖 SMTC。

## 来源说明

- Microsoft 文档说明 `GlobalSystemMediaTransportControlsSessionManager` 是 Windows 10 version 1809+ API，可请求 session manager 并列出可用媒体会话。
- Microsoft 文档说明 `GlobalSystemMediaTransportControlsSession` 提供读取播放信息、读取媒体属性，以及请求 play、pause、skip、stop、toggle、seek、rate、shuffle、repeat、fast-forward、rewind 等控制的方法。
- Microsoft 文档说明媒体属性包括 title、artist、album title、album artist、genres、subtitle、thumbnail、playback type 和 track numbers 等字段。
- 当前本地 SMTC 命令/helper 映射了项目侧子集：status、sessions、play、pause、toggle、next、previous、stop、seek、rate、shuffle、repeat、fast-forward、rewind、媒体元数据、时间线、会话暴露的控制能力和控制接受状态。

参考链接：

- https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmanager
- https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssession
- https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmediaproperties
