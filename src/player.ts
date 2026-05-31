/**
 * Music playback — NetEase Cloud Music official web player strategy.
 *
 * The CLI deliberately opens the official NetEase web route instead of trying
 * to resolve audio streams. This keeps playback inside the user's browser or
 * desktop client and avoids CDN/DRM bypass behavior.
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
}

/** Common NetEase Cloud Music song IDs for reference */
export const SONG_IDS = {
  UNIQUE: 1807799505,       // 告五人 - 唯一
  LOVE_MISS: 1368754688,    // 告五人 - 爱人错过
  MAGIC_POTION: 1959667345, // 告五人 - 给你一瓶魔法药水
  NIGHT_LIFE: 1410647903,   // 告五人 - 带我去找夜生活
  SUNNY: 186016,            // 周杰伦 - 晴天
} as const;

function openUrl(url: string): void {
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
  if (options.open === false) {
    return {
      player: 'none',
      success: true,
      opened: false,
      url: webUrl,
      message: [
        `🔇 未打开浏览器: ${title || ''}`,
        `🔗 ${webUrl}`,
        `📖 歌词: nm music lyric --id ${songId}`,
      ].join('\n'),
    };
  }

  try {
    openUrl(webUrl);
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
