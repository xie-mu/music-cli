import { NeteaseAPI } from '../http.js';
import { Album, CapabilityResult, capabilityResult, normalizeAlbum } from '../domain/models.js';
import { LocalStore } from '../state/local-store.js';

export class AlbumService {
  constructor(private api: NeteaseAPI, private store?: LocalStore) {}

  async show(id: number): Promise<CapabilityResult<Album>> {
    const data = await this.api.request(`/api/album/${id}`, undefined, 'GET');
    return capabilityResult(normalizeAlbum(data), 'netease:album/show', { raw: data });
  }

  async list(): Promise<CapabilityResult<Album[]>> {
    const data = await this.api.request('/api/album/sublist', { limit: 50, offset: 0 });
    return capabilityResult((data.data || []).map(normalizeAlbum), 'netease:album/sublist', {
      requiresAuth: true,
      raw: data,
    });
  }

  async sub(id: number, subscribe: boolean): Promise<CapabilityResult<{ id: number; subscribed: boolean }>> {
    const data = await this.api.request('/api/album/sub', { id, t: subscribe ? 1 : 0 });
    await this.store?.appendEvent(subscribe ? 'album_sub' : 'album_unsub', { albumId: id });
    return capabilityResult({ id, subscribed: subscribe }, 'netease:album/sub', {
      requiresAuth: true,
      raw: data,
    });
  }

  async dynamic(id: number): Promise<CapabilityResult<any>> {
    const data = await this.api.request('/api/album/detail/dynamic', { id });
    return capabilityResult(data, 'netease:album/dynamic', { raw: data });
  }

  async summary(id: number): Promise<CapabilityResult<any>> {
    const album = await this.show(id);
    const totalMs = album.data.songs.reduce((sum, song) => sum + song.durationMs, 0);
    return capabilityResult({
      albumName: album.data.name,
      artist: album.data.artist?.name || '',
      publishTime: album.data.publishTime ? new Date(album.data.publishTime).toISOString().split('T')[0] : '',
      totalSongs: album.data.songs.length,
      totalMinutes: Math.round(totalMs / 60000),
    }, 'local:album/summary', { raw: album.raw });
  }
}
