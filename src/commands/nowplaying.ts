/**
 * "Now Playing" - detect what song is currently playing in the browser.
 *
 * Strategy: Read browser window titles via Windows API.
 * NetEase web player page title format:
 *   {SongName} - {Artist} - 单曲 - 网易云音乐
 *
 * Browser: Chrome, Edge (title appended after "-").
 */
import { execSync } from 'node:child_process';
import { Config, Command } from '../types/core.js';

interface NowPlayingInfo {
  songName: string;
  artist: string;
  source: string; // browser name
}

/** Read browser window titles via PowerShell → temp JSON file */
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const psScriptPath = __dirname.replace(/src\\commands$/, 'get_nowplaying.ps1');
const tmpFile = `${tmpdir()}\\nm_nowplaying.json`;

function getBrowserTitles(): string[] {
  try {
    execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}"`,
      { encoding: 'utf-8', timeout: 8000 }
    );
    const content = readFileSync(tmpFile, 'utf-8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Check if a window title is NetEase Cloud Music related */
function isNeteaseTitle(title: string): boolean {
  return title.includes('网易云音乐');
}

/** Parse song info from window title */
function parseTitle(title: string): NowPlayingInfo | null {
  // Title format: "唯一 - 告五人 - 单曲 - 网易云音乐 - Google Chrome"
  const browsers = ['Google Chrome', 'Microsoft Edge', 'Edge', 'Firefox', '- Chromium'];
  let clean = title;
  for (const b of browsers) {
    const idx = clean.lastIndexOf(` - ${b}`);
    if (idx >= 0) clean = clean.substring(0, idx);
  }
  clean = clean.trim();

  // Parse "Song - Artist - 单曲 - 网易云音乐"
  const match = clean.match(/^(.*?)\s*-\s*(.*?)\s*-\s*单曲/);
  if (!match) return null;

  return {
    songName: match[1].trim(),
    artist: match[2].trim(),
    source: title.includes('Chrome') ? 'Chrome' : title.includes('Edge') ? 'Edge' : '浏览器',
  };
}

export const nowplayingCommand: Command = {
  name: 'nowplaying',
  description: '检测浏览器中正在播放的歌曲',
  usage: 'nm nowplaying',
  options: [],
  examples: ['nm nowplaying', 'nm nowplaying --output json'],
  async run(config, flags) {
    const titles = getBrowserTitles();

    if (titles.length === 0) {
      process.stdout.write('未检测到浏览器中的网易云音乐页面\n');
      process.stdout.write('请在浏览器中打开 music.163.com 播放歌曲\n');
      return;
    }

    const results: NowPlayingInfo[] = [];
    for (const title of titles) {
      if (!isNeteaseTitle(title)) continue;
      const info = parseTitle(title);
      if (info) results.push(info);
    }

    if (results.length === 0) {
      process.stdout.write('检测到网易云音乐页面，但无法解析歌曲信息\n');
      if (flags.output === 'json') {
        process.stdout.write(JSON.stringify({ raw: titles }, null, 2) + '\n');
      }
      return;
    }

    if (flags.output === 'json') {
      process.stdout.write(JSON.stringify(results.length === 1 ? results[0] : results, null, 2) + '\n');
      return;
    }

    for (const r of results) {
      process.stdout.write(`🎵 正在播放: ${r.songName} - ${r.artist}\n`);
      process.stdout.write(`   🌐 ${r.source}\n\n`);
    }
  },
};
