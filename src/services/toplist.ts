import { NeteaseAPI } from '../http.js';
import { CapabilityResult, Playlist, Song, capabilityResult, normalizePlaylist, normalizeSong } from '../domain/models.js';

export class ToplistService {
  constructor(private api: NeteaseAPI) {}

  async list(): Promise<CapabilityResult<Playlist[]>> {
    const data = await this.api.request('/api/toplist');
    return capabilityResult((data.list || []).map(normalizePlaylist), 'netease:toplist', { raw: data });
  }

  async detail(id: number): Promise<CapabilityResult<Song[]>> {
    const data = await this.api.request('/api/v3/playlist/detail', { id });
    return capabilityResult((data.playlist?.tracks || []).map(normalizeSong), 'netease:toplist/detail', { raw: data });
  }
}
