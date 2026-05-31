import { NeteaseAPI } from '../http.js';
import { CapabilityResult, Playlist, Song, capabilityResult, normalizePlaylist, normalizeSong } from '../domain/models.js';

export class RecommendService {
  constructor(private api: NeteaseAPI) {}

  async songs(): Promise<CapabilityResult<Song[]>> {
    const data = await this.api.request('/api/v3/discovery/recommend/songs');
    const songs = data.data?.dailySongs || data.recommend || [];
    return capabilityResult(songs.map(normalizeSong), 'netease:recommend/songs', {
      requiresAuth: true,
      raw: data,
    });
  }

  async playlists(): Promise<CapabilityResult<Playlist[]>> {
    const data = await this.api.request('/api/v3/discovery/recommend/resource');
    return capabilityResult((data.recommend || []).map(normalizePlaylist), 'netease:recommend/playlists', {
      requiresAuth: true,
      raw: data,
    });
  }
}
