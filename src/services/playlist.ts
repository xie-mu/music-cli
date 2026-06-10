import { NeteaseAPI } from '../http.js';
import {
  CapabilityResult,
  Playlist,
  Song,
  capabilityResult,
  normalizePlaylist,
  normalizeSong,
} from '../domain/models.js';
import { NeteaseError } from '../error.js';
import { LocalStore } from '../state/local-store.js';

export interface PlaylistSummary {
  playlistName: string;
  totalSongs: number;
  totalMinutes: number;
  averageSeconds: number;
  topArtists: Array<{ name: string; count: number }>;
}

export class PlaylistService {
  constructor(private api: NeteaseAPI, private store?: LocalStore) {}

  async show(id: number): Promise<CapabilityResult<Playlist>> {
    const data = await this.api.request(`/api/v3/playlist/detail?id=${id}`);
    return capabilityResult(normalizePlaylist(data.playlist || data), 'netease:playlist/detail', { raw: data });
  }

  async tracks(id: number): Promise<CapabilityResult<Song[]>> {
    // Step 1: Get ALL track IDs from v6/playlist/detail with n=100000
    // v6 returns the trackIds array with every track's ID (unlike v3 which caps at 99)
    const detail = await this.api.request('/api/v6/playlist/detail', { id, n: 100000, s: 8 }, 'POST');
    const trackIds: Array<{ id: number }> = detail.playlist?.trackIds || [];

    if (trackIds.length === 0) {
      // Fallback: try to get tracks directly from v6 response
      const tracks = (detail.playlist?.tracks || []).map(normalizeSong);
      if (tracks.length > 0) return capabilityResult(tracks, 'netease:playlist/tracks');
      return capabilityResult([], 'netease:playlist/tracks');
    }

    // Step 2: Fetch song details in batches of 100 via GET /api/song/detail
    const BATCH = 100;
    const allSongs: Song[] = [];

    for (let i = 0; i < trackIds.length; i += BATCH) {
      const batch = trackIds.slice(i, i + BATCH).map(t => t.id);
      // GET /api/song/detail?ids=[id1,id2,...] returns full song data
      const data = await this.api.request(
        `/api/song/detail?ids=${encodeURIComponent(JSON.stringify(batch))}`,
        undefined,
        'GET',
      );
      const songs = (data.songs || []).map(normalizeSong);
      allSongs.push(...songs);
    }

    return capabilityResult(allSongs, 'netease:playlist/tracks');
  }

  async list(uid?: number): Promise<CapabilityResult<Playlist[]>> {
    let targetUid = uid;
    if (!targetUid) {
      const account = await this.api.request('/api/nuser/account/get');
      targetUid = account.profile?.userId;
    }
    const data = await this.api.request(`/api/user/playlist?uid=${Number(targetUid)}&limit=50&offset=0`);
    return capabilityResult((data.playlist || []).map(normalizePlaylist), 'netease:user/playlist', {
      requiresAuth: !uid,
      raw: data,
    });
  }

  async summary(id: number): Promise<CapabilityResult<PlaylistSummary>> {
    const data = await this.api.request(`/api/v3/playlist/detail?id=${id}`);
    const tracks = data.playlist?.tracks || [];
    const totalMs = tracks.reduce((sum: number, song: any) => sum + (song.duration || song.dt || 0), 0);
    const artistMap = new Map<string, number>();

    for (const song of tracks) {
      const artists = song.ar || song.artists || [{ name: 'Unknown' }];
      for (const artist of artists) {
        artistMap.set(artist.name, (artistMap.get(artist.name) || 0) + 1);
      }
    }

    const summary: PlaylistSummary = {
      playlistName: data.playlist?.name || '',
      totalSongs: tracks.length,
      totalMinutes: Math.round(totalMs / 60000),
      averageSeconds: tracks.length > 0 ? Math.round(totalMs / tracks.length / 1000) : 0,
      topArtists: [...artistMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([name, count]) => ({ name, count })),
    };

    return capabilityResult(summary, 'netease:playlist/summary', { raw: data });
  }

  async create(name: string, desc = ''): Promise<CapabilityResult<any>> {
    const data = await this.api.requestWeapi('/api/playlist/create', {
      name,
      desc,
      privacy: 0,
      type: 'NORMAL',
    });
    await this.store?.appendEvent('playlist_create', { name });
    return capabilityResult(data, 'netease:playlist/create', { requiresAuth: true, raw: data });
  }

  async add(id: number, songIds: number[]): Promise<CapabilityResult<any>> {
    if (songIds.length === 0) {
      throw new NeteaseError('USAGE', 'No valid song IDs were provided', 'Use --song-ids <id1,id2>');
    }
    const data = await this.api.request('/api/playlist/manipulate/tracks', {
      op: 'add',
      pid: id,
      trackIds: JSON.stringify(songIds),
    });
    await this.store?.appendEvent('playlist_add', { playlistId: id, songIds });
    return capabilityResult(data, 'netease:playlist/manipulate/add', { requiresAuth: true, raw: data });
  }

  async remove(id: number, songIds: number[]): Promise<CapabilityResult<any>> {
    if (songIds.length === 0) {
      throw new NeteaseError('USAGE', 'No valid song IDs were provided', 'Use --song-ids <id1,id2>');
    }
    const data = await this.api.request('/api/playlist/manipulate/tracks', {
      op: 'del',
      pid: id,
      trackIds: JSON.stringify(songIds),
    });
    await this.store?.appendEvent('playlist_remove', { playlistId: id, songIds });
    return capabilityResult(data, 'netease:playlist/manipulate/remove', { requiresAuth: true, raw: data });
  }

  async audit(id: number): Promise<CapabilityResult<any>> {
    const tracks = await this.tracks(id);
    const seen = new Map<number, Song>();
    const duplicateIds: number[] = [];
    for (const song of tracks.data) {
      if (seen.has(song.id)) duplicateIds.push(song.id);
      seen.set(song.id, song);
    }
    return capabilityResult({
      playlistId: id,
      totalSongs: tracks.data.length,
      uniqueSongs: seen.size,
      duplicateIds,
      duplicateCount: duplicateIds.length,
    }, 'local:playlist/audit');
  }

  async dedupe(id: number, apply = false): Promise<CapabilityResult<any>> {
    const audit = await this.audit(id);
    if (apply && audit.data.duplicateIds.length > 0) {
      await this.remove(id, audit.data.duplicateIds);
    }
    return capabilityResult({ ...audit.data, applied: apply }, 'local:playlist/dedupe', {
      requiresAuth: apply,
    });
  }

  async merge(sourceIds: number[], targetId?: number, apply = false): Promise<CapabilityResult<any>> {
    const allTracks: Song[] = [];
    for (const sourceId of sourceIds) {
      const tracks = await this.tracks(sourceId);
      allTracks.push(...tracks.data);
    }
    const uniqueSongIds = [...new Set(allTracks.map(song => song.id))];
    if (apply && targetId) {
      await this.add(targetId, uniqueSongIds);
    }
    return capabilityResult({ sourceIds, targetId, songIds: uniqueSongIds, applied: apply }, 'local:playlist/merge', {
      requiresAuth: apply,
    });
  }
}
