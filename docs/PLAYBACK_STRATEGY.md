# 网易云音乐 CLI — 播放策略技术调研报告

> 2026-05-31
> 目标：实现无需用户手动点击播放按钮即可自动播放音乐

---

## 一、结论概要

**无法绕过用户一次点击实现自动播放。** 网易云音乐的产品设计和技术架构决定了网页播放器不能直接播放，必须通过桌面客户端。

---

## 二、技术架构分析

### 2.1 播放链路全景

```
nm music play --id X
  ↓
浏览器打开 https://music.163.com/#/song?id=X
  ↓
网页播放器 SPA 加载，显示歌曲详情页
  ↓
底部播放栏显示提示："打开客户端播放，享受高清音质"
  ↓
用户点击 ▶ 或 "去客户端播放"
  ↓
触发 orpheus:// 协议 → 桌面客户端启动并播放
```

### 2.2 核心发现

| 发现 | 证据 |
|---|---|
| **网页版不直接播放** | 页面底部明确提示 "打开客户端播放，享受高清音质" |
| **CDN 直链被屏蔽** | `m*.music.126.net` 始终返回 403，任何请求头均无效 |
| **流媒体协议** | 使用 MSE (MediaSource Extensions) + 加密分片，非简单 MP3 |
| **Desktop App 是唯一播放终端** | `orpheus://` 协议是播放的唯一途径 |
| **orpheus v3.1.34 深度链接失效** | 能启动客户端，但 `orpheus://song/{id}` 不跳转到指定歌曲 |

---

## 三、所有尝试过的方案

### 3.1 CDN 直链方案（全部 403）

| 尝试 | 请求头 | 结果 |
|---|---|---|
| 裸请求 | 无 | 403 |
| 加 Referer | `music.163.com` | 403 |
| 加 User-Agent | Chrome 标准 UA | 403 |
| 加 Cookie | MUSIC_U + __csrf | 403 |
| 移动端 UA | NeteaseMusic Android | 403 |
| 全浏览器头 | Accept/Accept-Lang/Sec-Fetch | 403 |
| Range 请求 | `bytes=0-1023` | 403 |

### 3.2 网页播放器方案

| 尝试 | 结果 | 原因 |
|---|---|---|
| Chrome `--autoplay-policy=no-user-gesture-required` | ❌ 不播放 | 页面本身不 autoplay，非浏览器策略 |
| `--app=URL` 模式 | ❌ 不播放 | 同上 |
| Playwright 注入 Cookie + 点击播放按钮 | ⚠️ Cookie 不被 SPA 识别 | Playwright 独立 Chromium 与用户默认浏览器隔离 |

### 3.3 orpheus 桌面协议方案

| URL 格式 | 结果 |
|---|---|
| `orpheus://song/{id}` | 启动但不跳转 |
| `orpheus://song?id={id}` | IPC 发送但不跳转 |
| `orpheus://play/{id}` | IPC 发送但不跳转 |
| `orpheus://play/song?id={id}` | IPC 发送但不跳转 |
| `cloudmusic.exe --webcmd=https://...` | 同上 |
| `cloudmusic.exe --webcmd=orpheus://...` | 同上 |

### 3.4 其他方案

| 尝试 | 结果 | 原因 |
|---|---|---|
| 旧版 API `/api/song/url` | 404 | 接口已移除 |
| API `/api/song/enable/play` | 404 | 接口不存在 |
| 嵌入播放器 `/outchain/player` | Flash 已弃用 | 基于 Flash，浏览器不支持 |
| ffplay/mpv 直链 | 403 | CDN 屏蔽 |

---

## 四、建议方案

### 当前最佳（已验证可用）

```
nm music play --id X
→ 打开 https://music.163.com/#/song?id=X
→ 用户点击 ▶ 播放按钮
→ 桌面客户端弹出并自动播放
```

用户仅需一次点击，这是网易云产品设计决定的交互流程。

### 未来可能的改进方向

| 方向 | 说明 | 可行性 |
|---|---|---|
| **Chrome 扩展** | 写一个扩展自动点击播放按钮 | 需用户安装，跨浏览器问题 |
| **CDP (Chrome DevTools Protocol)** | 连接到用户已打开的 Chrome 并执行点击 | 复杂，需用户先启动远程调试 |
| **桌面客户端 IPC 逆向** | 逆向 cloudmusic.exe 的 IPC 协议 | 高难度，需反编译 |
| **Electron 独立播放器** | 用 Electron 封装一个极简播放器 | 工作量大，但完全可控 |

---

## 五、相关代码

- `src/player.ts` — 当前播放策略实现（web player 方式）
- `player_playwright.mjs` — Playwright 实验性脚本（可用但 Cookie 注入需改进）
- `src/commands/music.ts:125-145` — play 命令 handler
