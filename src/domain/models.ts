export interface Artist {
  id: number;
  name: string;
  picUrl?: string;
  raw?: unknown;
}

export interface AlbumRef {
  id: number;
  name: string;
  picUrl?: string;
  publishTime?: number;
  raw?: unknown;
}

export interface Song {
  id: number;
  name: string;
  artists: Artist[];
  album?: AlbumRef;
  durationMs: number;
  fee?: number;
  mvId?: number;
  raw: unknown;
}

export interface Playlist {
  id: number;
  name: string;
  creator?: string;
  trackCount: number;
  playCount?: number;
  description?: string;
  tags: string[];
  tracks?: Song[];
  raw: unknown;
}

export interface Album {
  id: number;
  name: string;
  artist?: Artist;
  publishTime?: number;
  picUrl?: string;
  songs: Song[];
  raw: unknown;
}

export interface UserProfile {
  userId: number;
  nickname: string;
  signature?: string;
  avatarUrl?: string;
  listenSongs?: number;
  follows?: number;
  followeds?: number;
  raw: unknown;
}

export interface Lyric {
  songId: number;
  lrc: string;
  translated?: string;
  raw: unknown;
}

export interface PlayRecord {
  song: Song;
  playCount?: number;
  score?: number;
  raw: unknown;
}

export interface CapabilityResult<T> {
  ok: boolean;
  data: T;
  source: string;
  requiresAuth?: boolean;
  warnings?: string[];
  raw?: unknown;
}

export function capabilityResult<T>(
  data: T,
  source: string,
  options: Omit<CapabilityResult<T>, 'ok' | 'data' | 'source'> = {}
): CapabilityResult<T> {
  return { ok: true, data, source, ...options };
}

export function normalizeArtist(raw: any): Artist {
  return {
    id: Number(raw?.id ?? 0),
    name: String(raw?.name ?? ''),
    picUrl: raw?.picUrl ?? raw?.img1v1Url,
    raw,
  };
}

export function normalizeAlbumRef(raw: any): AlbumRef | undefined {
  if (!raw) return undefined;
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ''),
    picUrl: raw.picUrl ?? raw.blurPicUrl,
    publishTime: raw.publishTime,
    raw,
  };
}

export function normalizeSong(raw: any): Song {
  const artists = raw?.artists ?? raw?.ar ?? [];
  const album = raw?.album ?? raw?.al;
  return {
    id: Number(raw?.id ?? 0),
    name: String(raw?.name ?? ''),
    artists: Array.isArray(artists) ? artists.map(normalizeArtist) : [],
    album: normalizeAlbumRef(album),
    durationMs: Number(raw?.duration ?? raw?.dt ?? 0),
    fee: raw?.fee,
    mvId: raw?.mvid ?? raw?.mv,
    raw,
  };
}

export function normalizePlaylist(raw: any): Playlist {
  const tracks = raw?.tracks ?? raw?.playlist?.tracks;
  return {
    id: Number(raw?.id ?? raw?.playlist?.id ?? 0),
    name: String(raw?.name ?? raw?.playlist?.name ?? ''),
    creator: raw?.creator?.nickname ?? raw?.playlist?.creator?.nickname,
    trackCount: Number(raw?.trackCount ?? raw?.playlist?.trackCount ?? tracks?.length ?? 0),
    playCount: raw?.playCount ?? raw?.playcount ?? raw?.playlist?.playCount,
    description: raw?.description ?? raw?.playlist?.description,
    tags: raw?.tags ?? raw?.playlist?.tags ?? [],
    tracks: Array.isArray(tracks) ? tracks.map(normalizeSong) : undefined,
    raw,
  };
}

export function normalizeAlbum(raw: any): Album {
  const album = raw?.album ?? raw ?? {};
  return {
    id: Number(album.id ?? 0),
    name: String(album.name ?? ''),
    artist: album.artist ? normalizeArtist(album.artist) : undefined,
    publishTime: album.publishTime,
    picUrl: album.picUrl ?? album.blurPicUrl,
    songs: Array.isArray(album.songs) ? album.songs.map(normalizeSong) : [],
    raw,
  };
}

export function normalizeUserProfile(raw: any): UserProfile {
  const profile = raw?.profile ?? raw ?? {};
  return {
    userId: Number(profile.userId ?? profile.id ?? 0),
    nickname: String(profile.nickname ?? ''),
    signature: profile.signature,
    avatarUrl: profile.avatarUrl,
    listenSongs: profile.listenSongs,
    follows: profile.follows,
    followeds: profile.followeds,
    raw,
  };
}

export function normalizeLyric(songId: number, raw: any): Lyric {
  return {
    songId,
    lrc: raw?.lrc?.lyric ?? '',
    translated: raw?.tlyric?.lyric || undefined,
    raw,
  };
}

export function normalizePlayRecord(raw: any): PlayRecord {
  return {
    song: normalizeSong(raw?.song ?? raw),
    playCount: raw?.playCount,
    score: raw?.score,
    raw,
  };
}
