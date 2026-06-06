/**
 * Music playback — NetEase Cloud Music desktop client strategy.
 *
 * On Windows, pushes the song directly to the NetEase desktop client via the
 * `orpheus://` protocol handler using `cmd /c start`. This operates silently
 * in the background — no browser window, no client window popup — as long as
 * the client is already running.
 *
 * On macOS/Linux, falls back to opening the official web player in the browser.
 */
import { spawn } from 'node:child_process';
import { platform } from 'node:os';

export interface PlayerResult {
  player: string;
  success: boolean;
  message: string;
  opened: boolean;
  url: string;
}

export interface PlaySongOptions {
  open?: boolean;
  /** Force a specific player: 'orpheus' | 'browser' | undefined (auto) */
  player?: string;
}

/** Common NetEase Cloud Music song IDs for reference */
export const SONG_IDS = {
  UNIQUE: 1807799505,       // 告五人 - 唯一
  LOVE_MISS: 1368754688,    // 告五人 - 爱人错过
  MAGIC_POTION: 1959667345, // 告五人 - 给你一瓶魔法药水
  NIGHT_LIFE: 1410647903,   // 告五人 - 带我去找夜生活
  SUNNY: 186016,            // 周杰伦 - 晴天
} as const;

/** Push song to NetEase desktop client via orpheus:// protocol (silent, background) */
function pushOrpheus(songId: number): boolean {
  const system = platform();
  const orpheusUrl = `orpheus://song/${songId}`;

  try {
    if (system === 'win32') {
      spawn('cmd', ['/c', 'start', '', orpheusUrl], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
    } else if (system === 'darwin') {
      spawn('open', [orpheusUrl], { detached: true, stdio: 'ignore' });
    } else {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Open a URL in the default browser */
function openBrowserUrl(url: string): void {
  const system = platform();
  const child = system === 'win32'
    ? spawn('cmd', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      })
    : system === 'darwin'
      ? spawn('open', [url], {
          detached: true,
          stdio: 'ignore',
        })
      : spawn('xdg-open', [url], {
          detached: true,
          stdio: 'ignore',
        });
  child.unref();
}

export async function playSong(
  songId: number,
  title?: string,
  options: PlaySongOptions = {}
): Promise<PlayerResult> {
  const webUrl = `https://music.163.com/#/song?id=${songId}`;
  const system = platform();

  // ── --no-open: just return the URL ──────────────────────
  if (options.open === false) {
    return {
      player: 'none',
      success: true,
      opened: false,
      url: webUrl,
      message: [
        `🔇 未打开播放器: ${title || ''}`,
        `🔗 ${webUrl}`,
        `📖 歌词: nm music lyric --id ${songId}`,
      ].join('\n'),
    };
  }

  // ── orpheus:// (Windows/macOS desktop client, background) ──
  const useOrpheus = options.player === 'orpheus' || (!options.player && system === 'win32');
  if (useOrpheus) {
    const pushed = pushOrpheus(songId);
    if (pushed) {
      return {
        player: 'orpheus',
        success: true,
        opened: false,
        url: `orpheus://song/${songId}`,
        message: [
          `🎵 后台推送: ${title || ''}`,
          `📖 歌词: nm music lyric --id ${songId}`,
          `🎮 控制: nm smtc status`,
        ].join('\n'),
      };
    }
    // Fall through to browser if orpheus failed
  }

  // ── Browser fallback ────────────────────────────────────
  try {
    openBrowserUrl(webUrl);
    return {
      player: 'browser',
      success: true,
      opened: true,
      url: webUrl,
      message: [
        `🌐 已在浏览器打开: ${title || ''}`,
        `🔗 ${webUrl}`,
        `📖 歌词: nm music lyric --id ${songId}`,
        `💡 点击 ▶ 播放（浏览器限制自动播放）`,
      ].join('\n'),
    };
  } catch (err) {
    return {
      player: 'none',
      success: false,
      opened: false,
      url: webUrl,
      message: `打开失败: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
