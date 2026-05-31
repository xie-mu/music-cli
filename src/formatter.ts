import { OutputFormat } from './types/core.js';

/** Format seconds to mm:ss */
function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Format play count */
function formatCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return String(n);
}

/** Format a list of songs */
export function formatSongList(songs: any[]): string {
  if (!songs || songs.length === 0) return '暂无歌曲';
  return songs.map((s, i) => {
    const artists = s.artists || s.ar || [];
    const artistNames = artists.map((a: any) => a.name).join(', ');
    const duration = s.durationMs || s.duration || s.dt || 0;
    return `${i + 1}. ${s.name} - ${artistNames} [${formatDuration(duration)}]`;
  }).join('\n');
}

/** Format a playlist detail */
export function formatPlaylist(pl: any): string {
  const lines: string[] = [];
  lines.push(`📋 ${pl.name}`);
  if (pl.description) lines.push(`   描述: ${pl.description}`);
  lines.push(`   歌曲: ${pl.trackCount || pl.trackCount} 首 | 播放: ${formatCount(pl.playCount)} 次`);
  lines.push(`   创建者: ${pl.creator?.nickname || pl.userId}`);
  if (pl.tags?.length) lines.push(`   标签: ${pl.tags.join(', ')}`);
  return lines.join('\n');
}

/** Format user profile */
export function formatUserProfile(user: any): string {
  const lines: string[] = [];
  lines.push(`👤 ${user.nickname || user.nickname}`);
  if (user.signature) lines.push(`   签名: ${user.signature}`);
  lines.push(`   等级: ${user.level || '?'} | 听歌: ${formatCount(user.listenSongs || 0)} 首`);
  lines.push(`   创建天数: ${user.createDays || 0} 天`);
  lines.push(`   粉丝: ${formatCount(user.followeds || 0)} | 关注: ${formatCount(user.follows || 0)}`);
  return lines.join('\n');
}

/** Format album */
export function formatAlbum(album: any): string {
  const lines: string[] = [];
  lines.push(`💿 ${album.name}`);
  if (album.artist?.name) lines.push(`   歌手: ${album.artist.name}`);
  if (album.publishTime) {
    const date = new Date(album.publishTime);
    lines.push(`   发行: ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  }
  lines.push(`   歌曲数: ${album.size || album.songCount || 0}`);
  return lines.join('\n');
}

/** Generic output dispatcher */
export function formatOutput(data: any, format: OutputFormat): string {
  if (format === 'json') return JSON.stringify(data, null, 2);

  if (!data) return '';

  // Dispatch based on data shape
  if (data.code !== undefined) data = data.data || data;

  if (Array.isArray(data)) {
    if (data.length === 0) return '(empty)';
    // Try to detect type from first element
    const first = data[0];
    if (first.name && (first.artists || first.ar)) return formatSongList(data);
    if (first.name && first.trackCount !== undefined) return data.map(formatPlaylist).join('\n\n');
    return data.map(d => JSON.stringify(d)).join('\n');
  }

  if (data.songs) {
    let result = formatSongList(data.songs);
    if (data.songCount) result += `\n共 ${data.songCount} 首`;
    return result;
  }

  if (data.playlist) return formatPlaylist(data.playlist);
  if (data.album) return formatAlbum(data.album);
  if (data.profile) return formatUserProfile(data.profile);
  if (data.nickname) return formatUserProfile(data);
  if (data.name && data.trackCount !== undefined) return formatPlaylist(data);
  if (data.name && (data.artist || data.size !== undefined)) return formatAlbum(data);

  return JSON.stringify(data, null, 2);
}
