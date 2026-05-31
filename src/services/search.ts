import { NeteaseAPI } from '../http.js';
import {
  Album,
  Artist,
  CapabilityResult,
  Playlist,
  Song,
  capabilityResult,
  normalizeAlbum,
  normalizeArtist,
  normalizePlaylist,
  normalizeSong,
} from '../domain/models.js';
import { LocalStore } from '../state/local-store.js';

export type SearchType = 'song' | 'artist' | 'album' | 'playlist';

export class SearchService {
  constructor(private api: NeteaseAPI, private store?: LocalStore) {}

  async search(
    keyword: string,
    type: SearchType = 'song',
    limit = 20
  ): Promise<CapabilityResult<Song[] | Artist[] | Album[] | Playlist[]>> {
    const typeMap: Record<SearchType, number> = {
      song: 1,
      artist: 100,
      album: 10,
      playlist: 1000,
    };
    const data = await this.api.request('/api/search/get', {
      s: keyword,
      type: typeMap[type],
      limit,
      offset: 0,
    });
    const result = data.result || {};
    const rawItems = result.songs || result.artists || result.albums || result.playlists || [];
    const items = rawItems.map((item: any) => {
      if (type === 'artist') return normalizeArtist(item);
      if (type === 'album') return normalizeAlbum(item);
      if (type === 'playlist') return normalizePlaylist(item);
      return normalizeSong(item);
    });

    await this.store?.appendEvent('search', { keyword, type, limit, count: items.length });
    return capabilityResult(items, 'netease:search', { raw: data });
  }

  async hot(): Promise<CapabilityResult<any[]>> {
    const data = await this.api.request('/api/search/hot');
    return capabilityResult(data.data || data.hots || [], 'netease:search/hot', { raw: data });
  }

  async suggest(keyword: string): Promise<CapabilityResult<Array<{ keyword: string }>>> {
    const data = await this.api.request('/api/search/suggest/web', { s: keyword });
    const allSuggestions = data.result?.allMatch || [];
    return capabilityResult(
      allSuggestions.map((match: any) => ({ keyword: match.keyword })),
      'netease:search/suggest',
      { raw: data }
    );
  }
}
