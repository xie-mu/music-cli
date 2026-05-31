import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { NeteaseAPI } from '../http.js';
import { NeteaseError } from '../error.js';
import {
  CapabilityResult,
  Lyric,
  Song,
  capabilityResult,
  normalizeLyric,
  normalizeSong,
} from '../domain/models.js';
import { Config } from '../types/core.js';
import { LocalStore } from '../state/local-store.js';

export class MusicService {
  constructor(
    private api: NeteaseAPI,
    private config: Config,
    private store?: LocalStore
  ) {}

  async getInfo(ids: number[]): Promise<CapabilityResult<Song[]>> {
    const data = await this.api.request(`/api/song/detail?ids=${encodeURIComponent(JSON.stringify(ids))}`);
    const songs = (data.songs || []).map(normalizeSong);
    return capabilityResult(songs, 'netease:song/detail', { raw: data });
  }

  async getUrl(id: number, br = 320000): Promise<CapabilityResult<any[]>> {
    const data = await this.api.request('/api/song/enhance/player/url', {
      ids: `[${id}]`,
      br,
    }, 'POST');
    return capabilityResult(data.data || [], 'netease:song/player-url', {
      warnings: ['Direct CDN URLs may be blocked by NetEase restrictions.'],
      raw: data,
    });
  }

  async getLyric(id: number): Promise<CapabilityResult<Lyric>> {
    const data = await this.api.request('/api/song/lyric', { id, os: 'linux', lv: -1, kv: -1, tv: -1 }, 'POST');
    return capabilityResult(normalizeLyric(id, data), 'netease:song/lyric', { raw: data });
  }

  async like(id: number, like: boolean): Promise<CapabilityResult<{ id: number; liked: boolean }>> {
    const data = await this.api.request('/api/playlist/like', { trackId: id, like });
    await this.store?.appendEvent(like ? 'music_like' : 'music_unlike', { songId: id });
    return capabilityResult({ id, liked: like }, 'netease:playlist/like', { requiresAuth: true, raw: data });
  }

  async download(id: number, br = 320000, out?: string): Promise<CapabilityResult<{ path: string; bytes: number }>> {
    const info = await this.getInfo([id]);
    const song = info.data[0];
    const urlData = await this.getUrl(id, br);
    const urlInfo = urlData.data[0];
    if (!urlInfo?.url) {
      throw new NeteaseError('API_ERROR', 'Unable to get download URL', 'The song may require VIP access.');
    }

    const response = await fetch(urlInfo.url, {
      headers: { Referer: 'https://music.163.com', 'User-Agent': 'Mozilla/5.0' },
    });
    if (response.status === 403) {
      throw new NeteaseError('NETWORK', 'NetEase CDN blocked direct download', `Use: nm music play --id ${id}`);
    }
    if (!response.ok) throw new NeteaseError('NETWORK', `Download failed (HTTP ${response.status})`);

    const buffer = Buffer.from(await response.arrayBuffer());
    const outPath = out || join(this.config.downloadDir, `${song?.name || id}.mp3`);
    const dir = dirname(outPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(outPath, buffer);
    await this.store?.appendEvent('music_download', { songId: id, path: outPath, bytes: buffer.length });

    return capabilityResult({ path: outPath, bytes: buffer.length }, 'netease:cdn/download', {
      warnings: ['Direct downloads are best-effort and may fail due to CDN restrictions.'],
    });
  }
}
