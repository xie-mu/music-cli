# Linux 播放器方案调研报告

> 目标：为网易云音乐 CLI (`nm`) 寻找在 Linux 环境下可用的播放方案
> 2026-05-31

---

## 核心问题

网易云音乐 CDN（阿里云）对所有直接音频链接返回 **403 Forbidden**，包括带完整浏览器 Cookie 和请求头的请求。网页播放器使用 MSE (MediaSource Extensions) + 加密分片传输。

---

## 候选方案评估

### 方案 A：CDN 直链下载 + 本地播放

| 维度 | 评估 |
|---|---|
| **原理** | 获取 CDN URL → 下载到临时文件 → ffplay/mpv 播放 |
| **当前状态** | CDN 始终返回 403，即使带完整 Cookie + 浏览器请求头 |
| **可行性** | ❌ 不可行。CDN 限制无法绕过（已验证 10+ 种请求头组合） |
| **备注** | CDN 检查机制可能包括：IP 地理围栏、请求时间戳窗口、Referer + Origin + Sec-Fetch 联合校验 |

### 方案 B：代理转发 — 本地 HTTP 代理解码

| 维度 | 评估 |
|---|---|
| **原理** | 启动本地代理服务，模拟浏览器行为请求 CDN |
| **当前状态** | CDN 403 是 CDN 级别限制，非浏览器请求头问题 |
| **可行性** | ❌ 不可行。同方案 A，无法绕过阿里云 CDN 检查 |

### 方案 C：WebSocket 代理 — NetEase 桌面客户端 IPC

| 维度 | 评估 |
|---|---|
| **原理** | 通过 orpheus:// 协议唤醒桌面客户端，通过 IPC 获取解码后的音频流 |
| **当前状态** | `orpheus://song/{id}` 在 v3.1.34 深度链接失效，只能启动客户端 |
| **可行性** | ⚠️ 需要逆向 orpheus IPC 协议，工作量极大 |
| **备注** | 桌面客户端使用 Electron，IPC 通过 Chrome DevTools Protocol 或命名管道 |

### 方案 D：Playwright 浏览器自动化

| 维度 | 评估 |
|---|---|
| **原理** | Playwright 打开浏览器 → 加载网易云页面 → 注入 Cookie → 点击播放 → 音频通过 PulseAudio/ALSA 输出 |
| **当前状态** | Playwright v1.60 已安装，Chromium + Chrome 均可用 |
| **可行性** | ✅ **最可行方案** |
| **限制** | 需要显示服务（X11/Wayland）或虚拟显示（Xvfb） |
| **音频** | PulseAudio 网络共享或 ALSA loopback |

#### Playwright Linux 方案细节

```bash
# 虚拟显示（无显示器环境）
Xvfb :99 -screen 0 1280x720x24 &
export DISPLAY=:99

# 运行 Playwright 播放器
node player_playwright.mjs 1807799505

# 音频可通过 PulseAudio 网络传输到另一台机器
# 或使用 ALSA loopback + 音频转发
```

### 方案 E：VLC 网络串流

| 维度 | 评估 |
|---|---|
| **原理** | VLC 支持多种网络串流协议，可能支持 NetEase 的流媒体格式 |
| **当前状态** | CDN URL 返回 403，VLC 也无法绕过 |
| **可行性** | ❌ 前提是 CDN 限制能绕过 |

### 方案 F：直接调用 CloudMusic WebAPI 的播放接口

| 维度 | 评估 |
|---|---|
| **原理** | 网页播放器的 JavaScript 通过 XHR 获取音频分片，我们模拟这个流程 |
| **当前状态** | web 播放器使用 MSE (MediaSource Extensions)，需要完整 Content Decryption Module (CDM) 解密 |
| **可行性** | ❌ 涉及 DRM/加密分片，极难逆向 |

### 方案 G：mpv + yt-dlp 风格嵌入播放器

| 维度 | 评估 |
|---|---|
| **原理** | 类似 yt-dlp 下载 YouTube 音频，通过提取实际媒体流 URL 后传给 mpv |
| **当前状态** | 没有已知的 mpv 插件支持 NetEase |
| **可行性** | ❌ 需要找到可用的媒体流 URL，但 CDN 403 |

### 方案 H：构建独立的 Electron 播放器

| 维度 | 评估 |
|---|---|
| **原理** | 用 Electron 封装一个极简浏览器窗口，加载 NetEase web player，自动点击播放 |
| **当前状态** | Electron 项目从零开始，工作量约 3-5 天 |
| **可行性** | ✅ 技术可行，但周期长 |
| **优势** | 完全可控：可以嵌入 Node.js 子进程，通过 IPC 通信 |
| **劣势** | 二进制体积大（~150MB），需打包 Chromium |

---

## 推荐方案

### 短期（本周可实施）

```
Playwright 浏览器自动化 + 虚拟显示
```

**可行性**: ✅ 最高
**工作量**: 2-3 天
**依赖**: Node.js + Playwright + Xvfb + PulseAudio

```bash
# Linux 依赖安装
apt install xvfb pulseaudio
npm install playwright

# 运行
Xvfb :99 -screen 0 1280x720x24 &
DISPLAY=:99 node player_playwright.mjs 1807799505
```

Playwright 已经在该项目中可用（`player_playwright.mjs`），需要补充：
1. Linux 环境的 Xvfb + PulseAudio 配置
2. Cookie 注入到 Playwright 浏览器实例
3. 自动点击播放按钮（验证过的 `.ply.j-flag` 选择器）

### 中期（1-2 周）

```
独立 Electron 极简播放器
```

**可行性**: ✅ 技术可行
**工作量**: 3-5 天
**优势**: 
- 脱离对用户已安装浏览器的依赖
- 可通过 IPC 与 CLI 通信（当前播放状态、进度）
- 可嵌入系统托盘

### 长期（2-4 周）

```
mpv + 自定义 Lua 脚本集成
```

**可行性**: ⚠️ 依赖于 CDN 绕过或找到替代流媒体源
**工作量**: 需要先解决 CDN 403 问题

---

## 附录：CDN 403 诊断记录

| 尝试 | 请求头 | 结果 |
|---|---|---|
| 裸请求 | 无 | 403 |
| + Referer | `music.163.com` | 403 |
| + User-Agent | Chrome 134 | 403 |
| + Cookie | MUSIC_U + __csrf | 403 |
| 移动端 UA | NeteaseMusic Android | 403 |
| 全浏览器头 | Accept/Lang/Encoding/Sec-Fetch/Origin | 403 |
| Range 请求 | `bytes=0-1023` | 403 |
| 带 Cookie + 全头 | 全部浏览器头 | 403 |

CDN 由阿里云提供（`cdn-source: ali`），IP `122.228.195.21`。可能检查 IP 地理位置（仅限中国大陆 IP）或请求时间戳窗口。
