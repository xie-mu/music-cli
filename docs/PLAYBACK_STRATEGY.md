# 网易云音乐 CLI 播放策略

> 当前实现说明，依据 `src/player.ts`、`src/commands/music.ts` 和
> `src/commands/queue.ts`。

## 当前结论

`nm music play` 和 `nm queue play` 只负责把播放意图交给网易云官方入口。
CLI 不直接解密、拉流或确认音频是否真正播放。

当前播放入口由 `src/player.ts` 统一管理：

- Windows 自动模式优先尝试官方 `orpheus://` 桌面协议。
- 如果 Orpheus 协议启动失败，则回退到浏览器网页播放器。
- macOS 使用 Orpheus 协议；Linux 和其他平台使用浏览器网页播放器。
- `--no-open` 不打开任何外部播放器，只返回官方歌曲页面和本地播放意图。
- `--player browser` 强制浏览器路径。
- `--player orpheus` 强制 Orpheus 协议路径。

## 命令入口

```bash
nm music play --id <songId>
nm music play --id <songId> --player browser
nm music play --id <songId> --player orpheus --output json
nm music play --id <songId> --no-open --output json

nm queue play
nm queue play --no-open --output json

nm playlist play --id <playlistId>
nm playlist play --id <playlistId> --player orpheus --output json
nm playlist play --id <playlistId> --no-open --output json
```

`music play` 会先读取歌曲信息并记录本地 `music_play` 事件。`queue play`
会读取当前或下一首本地队列项，然后复用同一个 `playSong()` 播放交接逻辑。

## Orpheus 协议

桌面协议 URL 使用 base64 JSON，而不是旧的 path-style URL。

```text
orpheus://base64({"type":"song","id":"<songId>","cmd":"play","channel":"webset"})
orpheus://base64({"type":"playlist","id":"<playlistId>","cmd":"play","channel":"webset"})
```

## Queue versus desktop playlist

`nm queue *` is a CLI-local queue stored under local state. It is useful for
agent workflows that need a private pending-play list, but it does not mutate
the NetEase desktop client's right-side playback list.

To load a remote playlist into the NetEase desktop client playback list, use
`nm playlist play --id <playlistId>`. This uses the same official Orpheus
handoff channel as song playback, but sends `type:"playlist"` in the base64
payload.

`channel:"webset"` 模拟网页播放器到桌面客户端的官方桥接来源。旧式
`orpheus://song/{id}`、`orpheus://song?id={id}` 等格式不应作为当前实现依据。

## 浏览器回退

浏览器路径打开官方歌曲页：

```text
https://music.163.com/#/song?id=<songId>
```

网页播放器和 CDN 音源仍受网易云自己的鉴权、版权、地区和客户端策略约束。
直接音源 URL 或下载可能返回 403，这不是 CLI 能绕过的限制。

## 验证边界

- Orpheus 协议启动成功只说明系统接受了协议 handoff。
- 浏览器打开成功只说明官方页面被交给了默认浏览器。
- 以上两种情况都不是“已听到声音”的证明。
- Windows SMTC 能读取或请求控制网易云桌面客户端已经发布的媒体会话，但
  `controlSucceeded: true` 也只表示 Windows/客户端接受请求，不等于音频确认。
- `nm smtc status` 是当前 Windows 媒体会话读取入口。
- `nm nowplaying` 只解析浏览器窗口标题，不是 SMTC 读取入口，也不支持
  `--smtc`。

## 历史调研结论

之前验证过的限制仍然保留为产品边界：

| 方向 | 结论 |
|---|---|
| CDN 直链 | 可能返回 403，不能作为稳定播放路径 |
| 网页自动播放 | 浏览器策略和网易云页面逻辑都可能要求用户交互 |
| 旧 Orpheus URL | 能启动客户端但不可靠，当前实现不用 path-style URL |
| Playwright 注入 | 和用户浏览器登录态隔离，不能作为默认播放能力 |
| 本地播放器直连 | 不应绕过网易云官方流媒体和版权限制 |

## 相关实现

- `src/player.ts` - 播放 handoff、Orpheus URL、浏览器 fallback。
- `src/commands/music.ts` - `nm music play` 命令入口。
- `src/commands/queue.ts` - `nm queue play` 命令入口。
- `src/services/smtc.ts` - Windows SMTC 会话读取和控制归一化。
- `tools/smtc_query.cs` - Windows Runtime SMTC helper。
